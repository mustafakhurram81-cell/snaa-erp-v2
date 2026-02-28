"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { UserCog, Plus, Users, DollarSign, Calendar, Briefcase, Mail, Phone } from "lucide-react";
import { PageHeader, Button, Card, StatusBadge, Drawer, Input, Tabs, StatCard } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { EmployeeDetail } from "@/components/details/employee-detail";
import { formatCurrency, getInitials } from "@/lib/utils";

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

interface PayrollRun {
  id: string;
  month: string;
  employees: number;
  gross_total: number;
  deductions: number;
  net_total: number;
  status: string;
}

const mockEmployees: Employee[] = [
  { id: "1", name: "Mustafa Khurram", email: "mustafa@smithinst.com", phone: "+92-300-1111111", department: "Management", position: "CEO", hire_date: "2020-01-01", salary: 120000, status: "active" },
  { id: "2", name: "Ali Hassan", email: "ali@smithinst.com", phone: "+92-300-2222222", department: "Production", position: "Production Manager", hire_date: "2021-03-15", salary: 55000, status: "active" },
  { id: "3", name: "Fatima Shah", email: "fatima@smithinst.com", phone: "+92-300-3333333", department: "Finance", position: "Accountant", hire_date: "2022-06-01", salary: 45000, status: "active" },
  { id: "4", name: "Ahmed Raza", email: "ahmed@smithinst.com", phone: "+92-300-4444444", department: "Sales", position: "Sales Executive", hire_date: "2022-09-10", salary: 40000, status: "active" },
  { id: "5", name: "Sana Malik", email: "sana@smithinst.com", phone: "+92-300-5555555", department: "HR", position: "HR Manager", hire_date: "2021-01-20", salary: 55000, status: "active" },
  { id: "6", name: "Bilal Khan", email: "bilal@smithinst.com", phone: "+92-300-6666666", department: "Production", position: "Quality Inspector", hire_date: "2023-02-01", salary: 35000, status: "active" },
  { id: "7", name: "Nadia Aslam", email: "nadia@smithinst.com", phone: "+92-300-7777777", department: "Sales", position: "Customer Support", hire_date: "2023-08-15", salary: 30000, status: "active" },
  { id: "8", name: "Usman Tariq", email: "usman@smithinst.com", phone: "+92-300-8888888", department: "Production", position: "Machine Operator", hire_date: "2024-01-10", salary: 25000, status: "inactive" },
];

const mockPayrollRuns: PayrollRun[] = [
  { id: "1", month: "February 2026", employees: 7, gross_total: 380000, deductions: 38000, net_total: 342000, status: "pending" },
  { id: "2", month: "January 2026", employees: 8, gross_total: 405000, deductions: 40500, net_total: 364500, status: "completed" },
  { id: "3", month: "December 2025", employees: 8, gross_total: 405000, deductions: 40500, net_total: 364500, status: "completed" },
  { id: "4", month: "November 2025", employees: 8, gross_total: 395000, deductions: 39500, net_total: 355500, status: "completed" },
];

const attendanceData: Record<string, Record<string, string>> = {
  "Mon 24": { "1": "present", "2": "present", "3": "present", "4": "present", "5": "present", "6": "present", "7": "present", "8": "absent" },
  "Tue 25": { "1": "present", "2": "present", "3": "leave", "4": "present", "5": "present", "6": "present", "7": "present", "8": "absent" },
  "Wed 26": { "1": "present", "2": "present", "3": "present", "4": "absent", "5": "present", "6": "present", "7": "leave", "8": "absent" },
  "Thu 27": { "1": "present", "2": "present", "3": "present", "4": "present", "5": "present", "6": "absent", "7": "present", "8": "absent" },
  "Fri 28": { "1": "present", "2": "present", "3": "present", "4": "present", "5": "leave", "6": "present", "7": "present", "8": "absent" },
};

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
  { accessorKey: "month", header: "Month" },
  {
    accessorKey: "employees",
    header: "Employees",
    cell: ({ row }) => <span className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.employees}</span>,
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
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [activeDept, setActiveDept] = useState("All");
  const [activeTab, setActiveTab] = useState("employees");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const activeEmployees = employees.filter((e) => e.status === "active");
  const totalPayroll = activeEmployees.reduce((sum, e) => sum + e.salary, 0);

  const filtered = employees.filter((e) => {
    const matchesDept = activeDept === "All" || e.department === activeDept;
    return matchesDept;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="HR & Payroll"
        description="Employee management and payroll processing"
        actions={
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Employee
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Employees" value={employees.length.toString()} icon={<Users className="w-5 h-5 text-blue-500" />} />
        <StatCard title="Active" value={activeEmployees.length.toString()} icon={<Briefcase className="w-5 h-5 text-emerald-500" />} />
        <StatCard title="Monthly Payroll" value={formatCurrency(totalPayroll)} icon={<DollarSign className="w-5 h-5 text-violet-500" />} />
        <StatCard title="Departments" value="5" icon={<Calendar className="w-5 h-5 text-amber-500" />} />
      </div>

      <div className="flex items-center justify-between gap-4 mb-5">
        <Tabs
          tabs={[
            { key: "employees", label: "Employees", count: employees.length },
            { key: "payroll", label: "Payroll", count: mockPayrollRuns.length },
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
        <DataTable
          columns={employeeColumns}
          data={filtered}
          emptyMessage="No employees found"
          searchPlaceholder="Search employees..."
          onRowClick={(item) => setSelectedEmployee(item)}
        />
      )}

      {activeTab === "payroll" && (
        <DataTable
          columns={payrollColumns}
          data={mockPayrollRuns}
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
                {mockEmployees.map((emp) => {
                  const days = Object.values(attendanceData);
                  const presentCount = days.filter((d) => d[emp.id] === "present").length;
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
                        const status = attendanceData[day][emp.id] || "absent";
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
        onUpdate={(updated) => { setEmployees(employees.map((e) => e.id === updated.id ? updated : e)); setSelectedEmployee(updated); }}
      />

      <Drawer
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title="Add Employee"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => setShowDialog(false)}>Add Employee</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="John Doe" />
            <Input label="Email" type="email" placeholder="email@smithinst.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone" placeholder="+92-300-0000000" />
            <Input label="Department" placeholder="Production" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Position" placeholder="Machine Operator" />
            <Input label="Salary" type="number" placeholder="0" />
          </div>
          <Input label="Hire Date" type="date" />
        </div>
      </Drawer>
    </motion.div>
  );
}
