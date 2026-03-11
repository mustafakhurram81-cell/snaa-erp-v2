"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, DollarSign, Calendar, Briefcase, Mail, Phone, Download, Upload } from "lucide-react";
import { PageHeader, Button, Card, StatusBadge, Drawer, Input, Tabs, StatCard } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmployeeDetail } from "@/components/details/employee-detail";
import { formatCurrency, getInitials } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { supabase } from "@/lib/supabase";
import { exportToCSV } from "@/lib/csv-export";
import { TableSkeleton, EmptyState } from "@/components/ui/shared";
import { CSVImportDialog } from "@/components/shared/csv-import";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { validateEmail } from "@/lib/form-validation";

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  name: string; // computed field for display
  email: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  hire_date: string;
  salary: number;
  status: string;
}

interface PayrollRun {
  id: string;
  month: string;
  year: number;
  total_employees: number;
  gross_total: number;
  deductions: number;
  net_total: number;
  status: string;
}

// Empty fallback — show only real DB data
const fallbackPayroll: PayrollRun[] = [];

// Live attendance data — populated from DB
const defaultAttendance: Record<string, Record<string, string>> = {};

const departments = ["All", "Management", "Production", "Finance", "Sales", "HR"];

const statusDot: Record<string, string> = {
  present: "bg-emerald-500",
  absent: "bg-red-500",
  leave: "bg-amber-500",
};

const employeeColumns: ColumnDef<Employee, unknown>[] = [
  {
    accessorKey: "name",
    header: "Employee",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
          {getInitials(row.original.name)}
        </div>
        <div>
          <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{row.original.name}</p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{row.original.position}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "department",
    header: "Department",
    cell: ({ row }) => (
      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
        {row.original.department}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => (
      <div className="space-y-0.5">
        <p className="text-sm flex items-center gap-1" style={{ color: "var(--foreground)" }}>
          <Mail className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} /> {row.original.email}
        </p>
        <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
          <Phone className="w-3 h-3" /> {row.original.phone}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "salary",
    header: "Salary",
    cell: ({ row }) => (
      <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
        {formatCurrency(row.original.salary)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

const payrollColumns: ColumnDef<PayrollRun, unknown>[] = [
  {
    accessorKey: "month",
    header: "Month",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.month} {row.original.year}</span>,
  },
  {
    accessorKey: "total_employees",
    header: "Employees",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.total_employees}</span>,
  },
  {
    accessorKey: "gross_total",
    header: "Gross",
    cell: ({ row }) => <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{formatCurrency(row.original.gross_total)}</span>,
  },
  {
    accessorKey: "deductions",
    header: "Deductions",
    cell: ({ row }) => <span className="text-sm text-red-500">{formatCurrency(row.original.deductions)}</span>,
  },
  {
    accessorKey: "net_total",
    header: "Net Total",
    cell: ({ row }) => <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(row.original.net_total)}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
];

export default function HRPage() {
  const { data: rawEmployees, loading, create, update, remove, fetchAll } = useSupabaseTable<Employee>("employees");
  const employees = rawEmployees.map(e => ({ ...e, name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.email, position: e.role || '' }));
  const { data: payrollRuns } = useSupabaseTable<PayrollRun>("payroll_runs", { orderBy: "created_at", ascending: false });
  const [attendanceData, setAttendanceData] = useState<Record<string, Record<string, string>>>(defaultAttendance);

  useEffect(() => {
    const fetchAttendance = async () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const monday = new Date(now);
      monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // go back to Monday
      monday.setHours(0, 0, 0, 0);
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      friday.setHours(23, 59, 59, 999);

      const { data } = await supabase.from("attendance").select("*")
        .gte("date", monday.toISOString().split("T")[0])
        .lte("date", friday.toISOString().split("T")[0]);

      if (data && data.length > 0) {
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const result: Record<string, Record<string, string>> = {};
        data.forEach((row: any) => {
          const d = new Date(row.date);
          const key = `${dayNames[d.getDay()]} ${d.getDate()}`;
          if (!result[key]) result[key] = {};
          result[key][row.employee_id] = row.status?.toLowerCase() || "absent";
        });
        setAttendanceData(result);
      }
    };
    fetchAttendance();
  }, []);
  const displayPayroll = payrollRuns.length > 0 ? payrollRuns : fallbackPayroll;
  const [activeDept, setActiveDept] = useState("All");
  const [activeTab, setActiveTab] = useState("employees");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const [showImport, setShowImport] = useState(false);

  // Form state & Validation
  const [formData, setFormData] = useState({ first_name: "", last_name: "", email: "", phone: "", department: "", position: "", salary: "", hire_date: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const resetForm = () => {
    setFormData({ first_name: "", last_name: "", email: "", phone: "", department: "", position: "", salary: "", hire_date: "" });
    setFormErrors({});
  };

  const activeEmployees = employees.filter((e) => e.status === "active");
  const totalPayroll = activeEmployees.reduce((sum, e) => sum + (e.salary || 0), 0);

  const filtered = employees.filter((e) => activeDept === "All" || e.department === activeDept);

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState<Employee | null>(null);
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await remove(pendingDelete.id);
    setSelectedEmployee(null);
    setPendingDelete(null);
  };

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!formData.first_name.trim()) errors.first_name = "First name is required";
    if (!formData.last_name.trim()) errors.last_name = "Last name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailErr = validateEmail(formData.email);
      if (emailErr) errors.email = emailErr;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("error", "Please fix the errors in the form");
      return;
    }
    setFormErrors({});

    // Auto-generate employee_id: EMP-XXX
    const empCount = employees.length + 1;
    const empId = `EMP-${String(empCount).padStart(3, "0")}`;

    const result = await create({
      employee_id: empId,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      department: formData.department || "General",
      role: formData.position || "Employee",
      salary: parseFloat(formData.salary) || 0,
      hire_date: formData.hire_date || new Date().toISOString().split("T")[0],
      status: "active",
    } as Partial<Employee>);

    if (result) {
      setShowDialog(false);
      resetForm();
      toast("success", `${formData.first_name} ${formData.last_name} added as ${empId}`);
    } else {
      toast("error", "Failed to add employee");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="HR & Payroll"
        description="Employee management and payroll processing"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <Upload className="w-3.5 h-3.5" />
              Import
            </Button>
            <Button variant="secondary" onClick={() => exportToCSV(employees, 'employees', [
              { key: 'employee_id' as keyof Employee, label: 'ID' },
              { key: 'name' as keyof Employee, label: 'Name' },
              { key: 'email' as keyof Employee, label: 'Email' },
              { key: 'department' as keyof Employee, label: 'Department' },
              { key: 'salary' as keyof Employee, label: 'Salary' },
              { key: 'status' as keyof Employee, label: 'Status' },
            ])}>
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <Button onClick={() => { resetForm(); setShowDialog(true); }}>
              <Plus className="w-3.5 h-3.5" />
              Add Employee
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Employees" value={employees.length.toString()} icon={<Users className="w-5 h-5 text-blue-500" />} />
        <StatCard title="Active" value={activeEmployees.length.toString()} icon={<Briefcase className="w-5 h-5 text-emerald-500" />} />
        <StatCard title="Monthly Payroll" value={formatCurrency(totalPayroll)} icon={<DollarSign className="w-5 h-5 text-violet-500" />} />
        <StatCard title="Departments" value={new Set(employees.map(e => e.department).filter(Boolean)).size.toString()} icon={<Calendar className="w-5 h-5 text-amber-500" />} />
      </div>

      <div className="flex items-center justify-between gap-4 mb-5">
        <Tabs
          tabs={[
            { key: "employees", label: "Employees", count: employees.length },
            { key: "payroll", label: "Payroll", count: displayPayroll.length },
            { key: "attendance", label: "Attendance" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "employees" && (
          <div className="flex items-center gap-1 overflow-x-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveDept(dept)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeDept === dept ? "bg-blue-600 text-white" : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"
                  }`}
              >
                {dept}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "employees" && (
        loading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : filtered.length === 0 ? (
          <div className="py-8">
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No Employees Found"
              description="Your employee directory is empty for this filters."
              action={
                <Button onClick={() => { resetForm(); setShowDialog(true); }}>
                  <Plus className="w-4 h-4" /> Add First Employee
                </Button>
              }
            />
          </div>
        ) : (
          <DataTable
            columns={employeeColumns}
            data={filtered}
            enableColumnFilters
            filterableColumns={["department", "status"]}
            emptyMessage="No employees found"
            searchPlaceholder="Search employees..."
            onRowClick={(item) => setSelectedEmployee(item)}
          />
        )
      )}

      {activeTab === "payroll" && (
        <DataTable
          columns={payrollColumns}
          data={displayPayroll}
          enableColumnFilters
          filterableColumns={["status"]}
          emptyMessage="No payroll runs"
          searchPlaceholder="Search payroll..."
          enablePagination={false}
        />
      )}

      {activeTab === "attendance" && (
        <Card padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider px-4 py-3 sticky left-0" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Employee</th>
                  {Object.keys(attendanceData).map((day) => (
                    <th key={day} className="text-center text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>{day}</th>
                  ))}
                  <th className="text-center text-[11px] font-semibold uppercase tracking-wider px-4 py-3" style={{ color: "var(--muted-foreground)", background: "var(--secondary)" }}>Present</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(0, 8).map((emp, idx) => {
                  const empId = String(idx + 1);
                  const days = Object.values(attendanceData);
                  const presentCount = days.filter((d) => d[empId] === "present").length;
                  return (
                    <tr key={emp.id} className="border-b last:border-b-0 hover:bg-[var(--secondary)] transition-colors" style={{ borderColor: "var(--border)" }}>
                      <td className="px-4 py-3 sticky left-0" style={{ background: "var(--card)" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0">
                            {getInitials(emp.name)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{emp.name}</span>
                        </div>
                      </td>
                      {Object.keys(attendanceData).map((day) => {
                        const status = attendanceData[day][empId] || "absent";
                        return (
                          <td key={day} className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center">
                              <div className={`w-3 h-3 rounded-full ${statusDot[status]}`} title={status} />
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-bold" style={{ color: presentCount >= 4 ? "var(--foreground)" : "var(--muted-foreground)" }}>{presentCount}/5</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-3 border-t" style={{ borderColor: "var(--border)" }}>
            {Object.entries({ present: "Present", absent: "Absent", leave: "Leave" }).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <div className={`w-2.5 h-2.5 rounded-full ${statusDot[key]}`} />
                {label}
              </div>
            ))}
          </div>
        </Card>
      )}

      <EmployeeDetail
        employee={selectedEmployee}
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onUpdate={async (updated) => { const result = await update(updated.id, updated); if (result) setSelectedEmployee(result); }}
      />

      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="Add Employee"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Add Employee</Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name *" placeholder="John" error={formErrors.first_name} value={formData.first_name} onChange={(e) => { setFormData({ ...formData, first_name: e.target.value }); if (formErrors.first_name) setFormErrors({ ...formErrors, first_name: "" }); }} />
            <Input label="Last Name *" placeholder="Doe" error={formErrors.last_name} value={formData.last_name} onChange={(e) => { setFormData({ ...formData, last_name: e.target.value }); if (formErrors.last_name) setFormErrors({ ...formErrors, last_name: "" }); }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email *" type="email" placeholder="email@smithinst.com" error={formErrors.email} value={formData.email} onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (formErrors.email) setFormErrors({ ...formErrors, email: "" }); }} />
            <Input label="Phone" placeholder="+92-300-0000000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Department" placeholder="Production" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} />
            <Input label="Position" placeholder="Machine Operator" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Salary" type="number" placeholder="0" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} />
            <Input label="Hire Date" type="date" value={formData.hire_date} onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })} />
          </div>
        </div>
      </Drawer>

      <CSVImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        tableName="employees"
        displayName="Employees"
        requiredFields={["employee_id", "first_name", "last_name", "email", "hire_date"]}
        optionalFields={["phone", "department", "role", "salary", "status"]}
        onImportComplete={() => fetchAll()}
      />

      <DeleteConfirmation
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title={`Delete ${pendingDelete?.name}?`}
        description="This employee record will be permanently deleted. This action cannot be undone."
      />
    </motion.div>
  );
}
