"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { PageHeader, Button, Drawer, Input, StatusBadge } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { VendorDetail } from "@/components/details/vendor-detail";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";

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

const columns: ColumnDef<Vendor, unknown>[] = [
    {
        accessorKey: "name",
        header: "Vendor Name",
        cell: ({ row }) => (
            <div>
                <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{row.original.name}</p>
            </div>
        ),
    },
    {
        accessorKey: "vendor_code",
        header: "Vendor Code",
        cell: ({ row }) => (
            <span className="font-mono text-sm" style={{ color: "var(--muted-foreground)" }}>{row.original.vendor_code}</span>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
];

export default function VendorsPage() {
    const { data: vendors, loading, create, update, remove } = useSupabaseTable<Vendor>("vendors");
    const [showDialog, setShowDialog] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [formData, setFormData] = useState({ vendor_code: "", name: "" });
    const { toast } = useToast();

    const handleCreate = async () => {
        if (!formData.name.trim()) { toast("error", "Vendor name is required"); return; }
        if (!formData.vendor_code.trim()) { toast("error", "Vendor code is required"); return; }

        const result = await create({
            vendor_code: formData.vendor_code,
            name: formData.name,
            contact_name: "",
            email: "",
            phone: "",
            city: "",
            status: "active",
            ap_balance: 0,
        } as Partial<Vendor>);

        if (result) {
            setShowDialog(false);
            setFormData({ vendor_code: "", name: "" });
            toast("success", "Vendor created", `${formData.name} added successfully`);
        } else {
            toast("error", "Failed to create vendor");
        }
    };

    const handleUpdateVendor = async (updated: Vendor) => {
        const result = await update(updated.id, updated);
        if (result) {
            setSelectedVendor(result);
        }
    };

    const handleDeleteVendor = async (vendor: Vendor) => {
        const success = await remove(vendor.id);
        if (success) {
            setSelectedVendor(null);
        }
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

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={vendors}
                    searchPlaceholder="Search vendors..."
                    emptyMessage="No vendors found"
                    onRowClick={(item) => setSelectedVendor(item)}
                />
            )}

            <VendorDetail
                vendor={selectedVendor}
                open={!!selectedVendor}
                onClose={() => setSelectedVendor(null)}
                onUpdate={handleUpdateVendor}
                onDelete={handleDeleteVendor}
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
                    <Input label="Vendor Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Steel Corp" />
                    <Input label="Vendor Code *" value={formData.vendor_code} onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })} placeholder="V-006" />
                </div>
            </Drawer>
        </motion.div>
    );
}
