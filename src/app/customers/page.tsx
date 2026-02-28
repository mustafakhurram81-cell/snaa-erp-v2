"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Mail, Phone, MapPin } from "lucide-react";
import { PageHeader, Button, Drawer, Input, StatusBadge } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { CustomerDetail } from "@/components/details/customer-detail";
import { formatCurrency, getInitials } from "@/lib/utils";

interface Customer {
    id: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    city: string;
    country: string;
    status: string;
    ar_balance: number;
    created_at: string;
}

const mockCustomers: Customer[] = [
    { id: "1", name: "Dr. Ahmed Khan", company: "City Hospital", email: "ahmed@cityhospital.com", phone: "+92-300-1234567", city: "Karachi", country: "Pakistan", status: "active", ar_balance: 12500, created_at: "2025-12-01" },
    { id: "2", name: "Sarah Williams", company: "Metro Medical Center", email: "sarah@metromedical.com", phone: "+1-555-0123", city: "New York", country: "USA", status: "active", ar_balance: 8900, created_at: "2025-11-15" },
    { id: "3", name: "Dr. Fatima Al-Rashid", company: "Gulf Healthcare", email: "fatima@gulfhc.ae", phone: "+971-50-1234567", city: "Dubai", country: "UAE", status: "active", ar_balance: 22000, created_at: "2025-10-20" },
    { id: "4", name: "James Anderson", company: "Central Clinic", email: "james@centralclinic.co.uk", phone: "+44-20-7123456", city: "London", country: "UK", status: "active", ar_balance: 15200, created_at: "2025-09-10" },
    { id: "5", name: "Li Wei", company: "National Hospital Beijing", email: "liwei@nationalhospital.cn", phone: "+86-10-12345678", city: "Beijing", country: "China", status: "inactive", ar_balance: 0, created_at: "2025-08-05" },
    { id: "6", name: "Dr. Maria Santos", company: "Prime Healthcare", email: "maria@primehc.br", phone: "+55-11-912345678", city: "São Paulo", country: "Brazil", status: "active", ar_balance: 6300, created_at: "2026-01-05" },
];

const columns: ColumnDef<Customer, unknown>[] = [
    {
        accessorKey: "name",
        header: "Customer",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                    {getInitials(row.original.name)}
                </div>
                <div>
                    <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{row.original.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{row.original.company}</p>
                </div>
            </div>
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
        accessorKey: "city",
        header: "Location",
        cell: ({ row }) => (
            <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
                <MapPin className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                {row.original.city}, {row.original.country}
            </span>
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
    const [formData, setFormData] = useState({ name: "", company: "", email: "", phone: "", city: "", country: "" });

    const handleCreate = () => {
        const newCustomer: Customer = {
            id: Date.now().toString(),
            ...formData,
            status: "active",
            ar_balance: 0,
            created_at: new Date().toISOString(),
        };
        setCustomers([newCustomer, ...customers]);
        setShowDialog(false);
        setFormData({ name: "", company: "", email: "", phone: "", city: "", country: "" });
    };

    const handleUpdateCustomer = (updated: typeof customers[0]) => {
        setCustomers(customers.map((c) => c.id === updated.id ? updated : c));
        setSelectedCustomer(updated);
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
                        <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Dr. John Doe" />
                        <Input label="Company" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Hospital name" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1-555-0000" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                        <Input label="Country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="Country" />
                    </div>
                </div>
            </Drawer>
        </motion.div>
    );
}
