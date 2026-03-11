"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Download, Upload } from "lucide-react";
import { PageHeader, Button, Drawer, Input, StatusBadge } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { VendorDetail } from "@/components/details/vendor-detail";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { exportToCSV } from "@/lib/csv-export";
import { CSVImportDialog } from "@/components/shared/csv-import";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { logActivity } from "@/lib/activity-logger";
import { validateEmail } from "@/lib/form-validation";
import { TableSkeleton } from "@/components/ui/skeleton";

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
    const { data: vendors, loading, create, update, remove, fetchAll, lastError } = useSupabaseTable<Vendor>("vendors");
    const [showDialog, setShowDialog] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
    const [formData, setFormData] = useState({ vendor_code: "", name: "", contact_name: "", email: "", phone: "", city: "" });
    const { toast } = useToast();
    const resetForm = () => { setFormData({ vendor_code: "", name: "", contact_name: "", email: "", phone: "", city: "" }); };
    // Keyboard shortcut: N to create new
    useEffect(() => {
        const handleNew = () => { setShowDialog(true); };
        const handleEsc = () => { setShowDialog(false); resetForm(); };
        window.addEventListener("keyboard-new", handleNew);
        window.addEventListener("keyboard-escape", handleEsc);
        return () => { window.removeEventListener("keyboard-new", handleNew); window.removeEventListener("keyboard-escape", handleEsc); };
    }, []);


    const handleCreate = async () => {
        if (!formData.name.trim()) { toast("error", "Vendor name is required"); return; }
        if (!formData.vendor_code.trim()) { toast("error", "Vendor code is required"); return; }
        if (formData.email) {
            const emailErr = validateEmail(formData.email);
            if (emailErr) { toast("error", emailErr); return; }
        }

        const result = await create({
            vendor_code: formData.vendor_code,
            name: formData.name,
            contact_name: formData.contact_name,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            status: "active",
            ap_balance: 0,
        } as Partial<Vendor>);

        if (result) {
            setShowDialog(false);
            setFormData({ vendor_code: "", name: "", contact_name: "", email: "", phone: "", city: "" });
            toast("success", "Vendor created", `${formData.name} added successfully`);
            logActivity({ entityType: "vendor", entityId: result.id, action: "Vendor created", details: `${result.vendor_code} — ${formData.name}` });
        } else {
            toast("error", lastError.current || "Failed to create vendor");
        }
    };

    const handleUpdateVendor = async (updated: Vendor) => {
        const result = await update(updated.id, updated);
        if (result) {
            setSelectedVendor(result);
        }
    };

    const [pendingDelete, setPendingDelete] = useState<Vendor | null>(null);
    const handleDeleteVendor = async (vendor: Vendor) => {
        setPendingDelete(vendor);
    };
    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const success = await remove(pendingDelete.id);
        if (success) setSelectedVendor(null);
        setPendingDelete(null);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageHeader
                title="Vendors"
                description={`${vendors.length} registered suppliers`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setShowImport(true)}>
                            <Upload className="w-3.5 h-3.5" />
                            Import
                        </Button>
                        <Button variant="secondary" onClick={() => exportToCSV(vendors, 'vendors')}>
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </Button>
                        <Button onClick={() => setShowDialog(true)}>
                            <Plus className="w-3.5 h-3.5" />
                            Add Vendor
                        </Button>
                    </div>
                }
            />

            {loading ? (
                <TableSkeleton rows={5} columns={5} />
            ) : (
                <DataTable
                    tableId="vendors"
                    columns={columns}
                    data={vendors}
                    enableColumnFilters
                    filterableColumns={["status"]}
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
                onClose={() => { setShowDialog(false); resetForm(); }}
                title="Add Vendor"
                footer={
                    <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => { setShowDialog(false); resetForm(); }}>Cancel</Button>
                        <Button onClick={handleCreate}>Create Vendor</Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Vendor Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Steel Corp" />
                        <Input label="Vendor Code *" value={formData.vendor_code} onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })} placeholder="V-006" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Contact Person" value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} placeholder="Contact name" />
                        <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="vendor@example.com" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+92-300-0000000" />
                        <Input label="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="City" />
                    </div>
                </div>
            </Drawer>

            <CSVImportDialog
                open={showImport}
                onClose={() => setShowImport(false)}
                tableName="vendors"
                displayName="Vendors"
                requiredFields={["name", "vendor_code"]}
                optionalFields={["contact_name", "email", "phone", "city", "notes"]}
                onImportComplete={() => fetchAll()}
            />

            <DeleteConfirmation
                open={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title={`Delete ${pendingDelete?.name}?`}
                description="This vendor record will be permanently deleted. This action cannot be undone."
            />
        </motion.div>
    );
}
