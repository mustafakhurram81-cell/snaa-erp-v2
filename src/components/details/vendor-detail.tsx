"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input, DrawerSection, DrawerStatCard } from "@/components/ui/shared";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { Mail, Phone, MapPin, ClipboardList, Edit3, Save, X, Trash2, Store } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";
import { LiveActivityLog } from "@/components/shared/activity-log";
import { supabase } from "@/lib/supabase";
import { RoleGuard } from "@/components/shared/role-guard";

interface Vendor {
    id: string;
    vendor_code: string;
    name: string;
    contact_name: string;
    email: string;
    phone: string;
    city: string;
    status: string;
    total_orders?: number;
    ap_balance: number;
}

interface RelatedPO {
    id: string;
    po_number: string;
    total_amount: number | null;
    status: string | null;
    order_date: string | null;
}

interface VendorDetailProps {
    vendor: Vendor | null;
    open: boolean;
    onClose: () => void;
    onUpdate?: (vendor: Vendor) => void;
    onDelete?: (vendor: Vendor) => void;
}

export function VendorDetail({ vendor, open, onClose, onUpdate, onDelete }: VendorDetailProps) {
    if (!vendor) return null;
    const { toast } = useToast();
    const [showDelete, setShowDelete] = useState(false);
    const [activeTab, setActiveTab] = useState("pos");
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...vendor });
    const [relatedPOs, setRelatedPOs] = useState<RelatedPO[]>([]);
    const [loadingPOs, setLoadingPOs] = useState(false);

    useEffect(() => {
        if (vendor) { setEditData({ ...vendor }); setIsEditing(false); }
    }, [vendor]);

    // Fetch real purchase orders for this vendor
    useEffect(() => {
        if (!vendor?.id || !open) return;
        setLoadingPOs(true);
        supabase
            .from("purchase_orders")
            .select("id, po_number, total_amount, status, order_date")
            .eq("vendor_id", vendor.id)
            .order("order_date", { ascending: false })
            .limit(10)
            .then(({ data }) => {
                setRelatedPOs(data || []);
                setLoadingPOs(false);
            });
    }, [vendor?.id, open]);

    const totalSpend = relatedPOs.reduce((s, p) => s + (p.total_amount || 0), 0);

    const handleSave = async () => {
        if (onUpdate) onUpdate(editData);
        setIsEditing(false);
        toast("success", "Vendor updated", `${editData.name} saved successfully`);
        const { logActivity } = await import("@/lib/activity-logger");
        logActivity({ entityType: "vendor", entityId: vendor.id, action: "Vendor updated", details: vendor.name });
    };

    const handleCancel = () => { setEditData({ ...vendor }); setIsEditing(false); };

    const tabs = [
        { key: "pos", label: "Purchase Orders", count: relatedPOs.length },
        { key: "activity", label: "Activity" },
    ];

    return (
        <Drawer
            open={open}
            onClose={() => { handleCancel(); onClose(); }}
            title={isEditing ? "Edit Vendor" : "Vendor Details"}
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
                                <RoleGuard minRole="admin"><button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button></RoleGuard>
                                <Button><ClipboardList className="w-3.5 h-3.5" /> New PO</Button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <Store className="w-8 h-8" />
                </div>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Vendor name" />
                            <Input value={editData.vendor_code} onChange={(e) => setEditData({ ...editData, vendor_code: e.target.value })} placeholder="Vendor code" />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{vendor.name}</h3>
                            <p className="text-sm mt-0.5 font-mono" style={{ color: "var(--muted-foreground)" }}>{vendor.vendor_code}</p>
                        </>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    {!isEditing && <StatusBadge status={vendor.status} />}
                    {isEditing && (
                        <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                            className="h-8 px-3 rounded-lg border text-xs font-medium"
                            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Contact Info */}
            <DrawerSection label="Contact Information">
                <div className="rounded-xl border p-4" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
                    {isEditing ? (
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Contact Name" value={editData.contact_name} onChange={(e) => setEditData({ ...editData, contact_name: e.target.value })} />
                            <Input label="City" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                            <Input label="Email" value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                            <Input label="Phone" value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                        </div>
                    ) : (
                        <>
                            <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>Contact Person</p>
                            <p className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>{vendor.contact_name}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                                    <Mail className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /> {vendor.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
                                    <Phone className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /> {vendor.phone}
                                </div>
                                <div className="flex items-center gap-2 text-sm col-span-2" style={{ color: "var(--foreground)" }}>
                                    <MapPin className="w-3.5 h-3.5" style={{ color: "var(--muted-foreground)" }} /> {vendor.city}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DrawerSection>

            {/* Stats */}
            <DrawerSection label="Financial">
                <div className="grid grid-cols-2 gap-3">
                    <DrawerStatCard label="Total Orders" value={relatedPOs.length} accent="blue" />
                    <DrawerStatCard label="Total Spend" value={formatCurrency(totalSpend)} accent="violet" />
                </div>
            </DrawerSection>

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                    {activeTab === "pos" && (
                        <div className="space-y-2">
                            {loadingPOs ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>Loading purchase orders...</div>
                            ) : relatedPOs.length === 0 ? (
                                <div className="py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No purchase orders found</div>
                            ) : (
                                relatedPOs.map((po) => (
                                    <div key={po.id} className="flex items-center justify-between p-3 rounded-xl border transition-all duration-200 hover:shadow-soft-md hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer group" style={{ borderColor: "var(--border)" }}>
                                        <div>
                                            <p className="text-sm font-bold group-hover:text-indigo-600 transition-colors" style={{ color: "var(--primary)" }}>{po.po_number}</p>
                                            <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{formatDate(po.order_date || "")}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(po.total_amount ?? 0)}</span>
                                            <StatusBadge status={po.status || "unknown"} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    {activeTab === "activity" && (
                        <LiveActivityLog entityType="vendor" entityId={vendor.id} />
                    )}
                </>
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={async () => { setShowDelete(false); if (onDelete) { onDelete(vendor); } const { logActivity } = await import("@/lib/activity-logger"); logActivity({ entityType: "vendor", entityId: vendor.id, action: "Vendor deleted", details: vendor.name }); toast("success", "Vendor deleted", `${vendor.name} deleted`); onClose(); }}
                title={`Delete ${vendor.name}?`}
                description="This action cannot be undone. The vendor and all associated data will be permanently removed."
            />
        </Drawer>
    );
}
