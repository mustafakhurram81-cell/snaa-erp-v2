"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Mail, Phone, MapPin } from "lucide-react";
import { PageHeader, Button, Drawer, Input, StatusBadge } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { CustomerDetail } from "@/components/details/customer-detail";
import { formatCurrency, getInitials } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export const CUSTOMER_TYPES = [
    { value: "hospital", label: "Hospital" },
    { value: "distributor", label: "Distributor" },
    { value: "private_practitioner", label: "Private Practitioner" },
    { value: "clinic", label: "Clinic" },
    { value: "government", label: "Government" },
] as const;

const typeColors: Record<string, string> = {
    hospital: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    distributor: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    private_practitioner: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    clinic: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    government: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

interface Customer {
    id: string;
    name: string;
    type: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    status: string;
    ar_balance: number;
    created_at: string;
}

const mockCustomers: Customer[] = [
    { id: "1", name: "Dr. Ahmed Khan", type: "hospital", email: "ahmed@cityhospital.com", phone: "+92-300-1234567", city: "Karachi", country: "Pakistan", status: "active", ar_balance: 12500, created_at: "2025-12-01" },
    { id: "2", name: "Sarah Williams", type: "distributor", email: "sarah@metromedical.com", phone: "+1-555-0123", city: "New York", country: "USA", status: "active", ar_balance: 8900, created_at: "2025-11-15" },
    { id: "3", name: "Dr. Fatima Al-Rashid", type: "hospital", email: "fatima@gulfhc.ae", phone: "+971-50-1234567", city: "Dubai", country: "UAE", status: "active", ar_balance: 22000, created_at: "2025-10-20" },
    { id: "4", name: "James Anderson", type: "clinic", email: "james@centralclinic.co.uk", phone: "+44-20-7123456", city: "London", country: "UK", status: "active", ar_balance: 15200, created_at: "2025-09-10" },
    { id: "5", name: "Li Wei", type: "government", email: "liwei@nationalhospital.cn", phone: "+86-10-12345678", city: "Beijing", country: "China", status: "inactive", ar_balance: 0, created_at: "2025-08-05" },
    { id: "6", name: "Dr. Maria Santos", type: "private_practitioner", email: "maria@primehc.br", phone: "+55-11-912345678", city: "São Paulo", country: "Brazil", status: "active", ar_balance: 6300, created_at: "2026-01-05" },
];

function getTypeLabel(type: string) {
    return CUSTOMER_TYPES.find(t => t.value === type)?.label || type;
}

const columns: ColumnDef<Customer, unknown>[] = [
    {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{row.original.name}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {row.original.city}, {row.original.country}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => (
            <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeColors[row.original.type] || "bg-zinc-100 text-zinc-600"}`}>
                {getTypeLabel(row.original.type)}
            </span>
        ),
    },
    {
        accessorKey: "email",
        header: "Contact",
        cell: ({ row }) => (
            <div className="space-y-0.5">
                <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
                    <Mail className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} /> {row.original.email}
                </p>
                <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                    <Phone className="w-3 h-3" /> {row.original.phone}
                </p>
            </div>
        ),
    },
    {
        accessorKey: "ar_balance",
        header: "AR Balance",
        cell: ({ row }) => (
            <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                {formatCurrency(row.original.ar_balance)}
            </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        enableSorting: true,
    },
];

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ name: "", type: "", email: "", phone: "", city: "", country: "" });
    const { toast } = useToast();

    const handleCreate = () => {
        if (!formData.name.trim()) { toast("error", "Name is required"); return; }
        if (!formData.type) { toast("error", "Customer type is required"); return; }
        if (!formData.email.trim()) { toast("error", "Email is required"); return; }
        if (!formData.phone.trim()) { toast("error", "Phone is required"); return; }
        if (!formData.city.trim()) { toast("error", "City is required"); return; }
        if (!formData.country.trim()) { toast("error", "Country is required"); return; }

        const newCustomer: Customer = {
            id: Date.now().toString(),
            ...formData,
            status: "active",
            ar_balance: 0,
            created_at: new Date().toISOString(),
        };
        setCustomers([newCustomer, ...customers]);
        setShowDialog(false);
        setFormData({ name: "", type: "", email: "", phone: "", city: "", country: "" });
        toast("success", "Customer created", `${formData.name} added successfully`);
    };

    const handleUpdateCustomer = (updated: typeof customers[0]) => {
        setCustomers(customers.map((c) => c.id === updated.id ? updated : c));
        setSelectedCustomer(updated);
    };

    const handleDeleteCustomer = (customer: typeof customers[0]) => {
        setCustomers(customers.filter((c) => c.id !== customer.id));
        setSelectedCustomer(null);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageHeader
                title="Customers"
                description={`${customers.length} total customers`}
                actions={
                    <Button onClick={() => setShowDialog(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        Add Customer
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={customers}
                enableSelection
                enableColumnVisibility
                searchPlaceholder="Search customers..."
                emptyMessage="No customers found"
                onRowClick={(item) => setSelectedCustomer(item)}
            />

            <CustomerDetail
                customer={selectedCustomer}
                open={!!selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
                onUpdate={handleUpdateCustomer}
                onDelete={handleDeleteCustomer}
            />

            <Drawer
                open={showDialog}
                onClose={() => setShowDialog(false)}
                title="Add Customer"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Customer</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Full Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Dr. John Doe" />
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Customer Type *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                style={{ background: "var(--background)", borderColor: "var(--border)", color: formData.type ? "var(--foreground)" : "var(--muted-foreground)" }}
                            >
                                <option value="">Select type...</option>
                                {CUSTOMER_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Email *" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                        <Input label="Phone *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1-555-0000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="City *" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                        <Input label="Country *" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Country" />
                    </div>
                </div>
            </Drawer>
        </motion.div>
    );
}
