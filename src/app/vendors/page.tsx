"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Mail, MapPin } from "lucide-react";
import { PageHeader, Button, Drawer, Input, StatusBadge } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { VendorDetail } from "@/components/details/vendor-detail";
import { formatCurrency, getInitials } from "@/lib/utils";

interface Vendor {
    id: string;
    vendor_code: string;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    city: string;
    status: string;
    ap_balance: number;
}

const mockVendors: Vendor[] = [
    { id: "1", vendor_code: "V-001", name: "Premium Steel Corp", contact_name: "Ali Hassan", email: "ali@premiumsteel.pk", phone: "+92-42-123-4567", city: "Sialkot", status: "active", ap_balance: 45000 },
    { id: "2", vendor_code: "V-002", name: "Global Stainless Ltd", contact_name: "John Smith", email: "john@globalsteel.com", phone: "+86-21-12345678", city: "Shanghai", status: "active", ap_balance: 82000 },
    { id: "3", vendor_code: "V-003", name: "Euro Metals GMBH", contact_name: "Hans Mueller", email: "hans@eurometals.de", phone: "+49-30-12345", city: "Berlin", status: "active", ap_balance: 15500 },
    { id: "4", vendor_code: "V-004", name: "Precision Parts Ltd", contact_name: "Bilal Ahmed", email: "bilal@precisionparts.pk", phone: "+92-52-345-6789", city: "Sialkot", status: "active", ap_balance: 28000 },
    { id: "5", vendor_code: "V-005", name: "Packaging World", contact_name: "Nadia Khan", email: "nadia@packworld.pk", phone: "+92-42-987-6543", city: "Lahore", status: "inactive", ap_balance: 0 },
];

const columns: ColumnDef<Vendor, unknown>[] = [
    {
        accessorKey: "name",
        header: "Vendor",
        cell: ({ row }) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                    {getInitials(row.original.name)}
                </div>
                <div>
                    <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{row.original.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{row.original.vendor_code}</p>
                </div>
            </div>
        ),
    },
    {
        accessorKey: "contact_name",
        header: "Contact",
        cell: ({ row }) => (
            <div className="space-y-0.5">
                <p className="text-sm" style={{ color: "var(--foreground)" }}>{row.original.contact_name}</p>
                <p className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                    <Mail className="w-3 h-3" /> {row.original.email}
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
                {row.original.city}
            </span>
        ),
    },
    {
        accessorKey: "ap_balance",
        header: "AP Balance",
        cell: ({ row }) => (
            <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
                {formatCurrency(row.original.ap_balance)}
            </span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
];

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [formData, setFormData] = useState({ vendor_code: "", name: "", contact_name: "", email: "", phone: "", city: "" });

    const handleCreate = () => {
        const newVendor: Vendor = {
            id: Date.now().toString(),
            ...formData,
            status: "active",
            ap_balance: 0,
        };
        setVendors([newVendor, ...vendors]);
        setShowDialog(false);
        setFormData({ vendor_code: "", name: "", contact_name: "", email: "", phone: "", city: "" });
    };

    const handleUpdateVendor = (updated: typeof vendors[0]) => {
        setVendors(vendors.map((v) => v.id === updated.id ? updated : v));
        setSelectedVendor(updated);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageHeader
                title="Vendors"
                description={`${vendors.length} registered suppliers`}
                actions={
                    <Button onClick={() => setShowDialog(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        Add Vendor
                    </Button>
                }
            />

            <DataTable
                columns={columns}
                data={vendors}
                searchPlaceholder="Search vendors..."
                emptyMessage="No vendors found"
                onRowClick={(item) => setSelectedVendor(item)}
            />

            <VendorDetail
                vendor={selectedVendor}
                open={!!selectedVendor}
                onClose={() => setSelectedVendor(null)}
                onUpdate={handleUpdateVendor}
            />

            <Drawer
                open={showDialog}
                onClose={() => setShowDialog(false)}
                title="Add Vendor"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Vendor</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Vendor Code" value={formData.vendor_code} onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })} placeholder="V-006" />
                        <Input label="Company Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Steel Corp" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Contact Person" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} placeholder="Full name" />
                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1-555-0000" />
                        <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                    </div>
                </div>
            </Drawer>
        </motion.div>
    );
}
