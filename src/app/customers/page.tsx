"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Mail, Phone, Download, Upload } from "lucide-react";
import { PageHeader, Button, Drawer, Input, StatusBadge, Select } from "@/components/ui/shared";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { CustomerDetail } from "@/components/details/customer-detail";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { useSupabaseTable } from "@/lib/supabase-hooks";
import { exportToCSV } from "@/lib/csv-export";
import { CSVImportDialog } from "@/components/shared/csv-import";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { logActivity } from "@/lib/activity-logger";
import { validateEmail, validatePhone } from "@/lib/form-validation";
import { TableSkeleton } from "@/components/ui/skeleton";

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
    const { data: customers, loading, create, update, remove, fetchAll } = useSupabaseTable<Customer>("customers");
    const [showDialog, setShowDialog] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState({ name: "", type: "", email: "", phone: "", city: "", country: "" });
    const { toast } = useToast();
    // Keyboard shortcut: N to create new
    useEffect(() => {
        const handleNew = () => { setShowDialog(true); };
        const handleEsc = () => { setShowDialog(false); };
        window.addEventListener("keyboard-new", handleNew);
        window.addEventListener("keyboard-escape", handleEsc);
        return () => { window.removeEventListener("keyboard-new", handleNew); window.removeEventListener("keyboard-escape", handleEsc); };
    }, []);


    const handleCreate = async () => {
        if (!formData.name.trim()) { toast("error", "Name is required"); return; }
        if (!formData.type) { toast("error", "Customer type is required"); return; }
        if (!formData.email.trim()) { toast("error", "Email is required"); return; }
        const emailErr = validateEmail(formData.email);
        if (emailErr) { toast("error", emailErr); return; }
        if (!formData.phone.trim()) { toast("error", "Phone is required"); return; }
        const phoneErr = validatePhone(formData.phone);
        if (phoneErr) { toast("error", phoneErr); return; }
        if (!formData.city.trim()) { toast("error", "City is required"); return; }
        if (!formData.country.trim()) { toast("error", "Country is required"); return; }

        const result = await create({
            ...formData,
            status: "active",
            ar_balance: 0,
        } as Partial<Customer>);

        if (result) {
            setShowDialog(false);
            setFormData({ name: "", type: "", email: "", phone: "", city: "", country: "" });
            toast("success", "Customer created", `${formData.name} added successfully`);
            logActivity({ entityType: "customer", entityId: result.id, action: "Customer created", details: formData.name });
        } else {
            toast("error", "Failed to create customer");
        }
    };

    const handleUpdateCustomer = async (updated: Customer) => {
        const result = await update(updated.id, updated);
        if (result) {
            setSelectedCustomer(result);
        }
    };

    const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);
    const handleDeleteCustomer = async (customer: Customer) => {
        setPendingDelete(customer);
    };
    const confirmDelete = async () => {
        if (!pendingDelete) return;
        const success = await remove(pendingDelete.id);
        if (success) setSelectedCustomer(null);
        setPendingDelete(null);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <PageHeader
                title="Customers"
                description={`${customers.length} total customers`}
                actions={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setShowImport(true)}>
                            <Upload className="w-3.5 h-3.5" />
                            Import
                        </Button>
                        <Button variant="secondary" onClick={() => exportToCSV(customers, 'customers')}>
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </Button>
                        <Button onClick={() => setShowDialog(true)}>
                            <Plus className="w-3.5 h-3.5" />
                            Add Customer
                        </Button>
                    </div>
                }
            />

            {loading ? (
                <TableSkeleton rows={5} columns={5} />
            ) : (
                <DataTable
                    tableId="customers"
                    columns={columns}
                    data={customers}
                    enableSelection
                    enableColumnFilters
                    filterableColumns={["type"]}
                    enableColumnVisibility
                    searchPlaceholder="Search customers..."
                    emptyMessage="No customers found"
                    onRowClick={(item) => setSelectedCustomer(item)}
                />
            )}

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
                            <Select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                options={[
                                    { value: "", label: "Select type..." },
                                    ...CUSTOMER_TYPES.map(t => ({ value: t.value, label: t.label }))
                                ]}
                                className="w-full h-9 px-3 rounded-lg border text-sm bg-[var(--background)] border-[var(--border)] text-[var(--foreground)]"
                            />
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

            <CSVImportDialog
                open={showImport}
                onClose={() => setShowImport(false)}
                tableName="customers"
                displayName="Customers"
                requiredFields={["name"]}
                optionalFields={["type", "email", "phone", "city", "country", "notes"]}
                onImportComplete={() => fetchAll()}
            />

            <DeleteConfirmation
                open={!!pendingDelete}
                onClose={() => setPendingDelete(null)}
                onConfirm={confirmDelete}
                title={`Delete ${pendingDelete?.name}?`}
                description="This customer record will be permanently deleted. This action cannot be undone."
            />
        </motion.div>
    );
}
