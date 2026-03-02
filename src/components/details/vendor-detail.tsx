"use client";

import React, { useState, useEffect } from "react";
import { Drawer, Button, StatusBadge, DrawerTabs, Input } from "@/components/ui/shared";
import { formatCurrency, getInitials } from "@/lib/utils";
import { Mail, Phone, MapPin, ClipboardList, Edit3, Save, X, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { DeleteConfirmation } from "@/components/shared/delete-confirmation";

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

const relatedPOs = [
    { id: "PO-2026-028", date: "Feb 24, 2026", total: 28000, status: "sent" },
    { id: "PO-2026-024", date: "Feb 10, 2026", total: 9500, status: "closed" },
    { id: "PO-2026-019", date: "Jan 28, 2026", total: 15000, status: "closed" },
];

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

    useEffect(() => {
        if (vendor) { setEditData({ ...vendor }); setIsEditing(false); }
    }, [vendor]);

    const handleSave = () => {
        if (onUpdate) onUpdate(editData);
        setIsEditing(false);
        toast("success", "Vendor updated", `${editData.name} saved successfully`);
    };

    const handleCancel = () => { setEditData({ ...vendor }); setIsEditing(false); };

    const tabs = [
        { key: "pos", label: "Purchase Orders", count: relatedPOs.length },
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
                                <button onClick={() => setShowDelete(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                <Button><ClipboardList className="w-3.5 h-3.5" /> New PO</Button>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            {/* Header */}
            <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {getInitials(isEditing ? editData.name : vendor.name)}
                </div>
                <div className="flex-1">
                    {isEditing ? (
                        <div className="space-y-2">
                            <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Vendor name" />
                            <Input value={editData.vendor_code} onChange={(e) => setEditData({ ...editData, vendor_code: e.target.value })} placeholder="Vendor code" />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{vendor.name}</h3>
                            <p className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>{vendor.vendor_code}</p>
                        </>
                    )}
                </div>
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

            {/* Contact Info */}
            <div className="rounded-xl border p-4 mb-5" style={{ background: "var(--secondary)", borderColor: "var(--border)" }}>
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

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Orders</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{vendor.total_orders ?? relatedPOs.length}</p>
                </div>
                <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Spend</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ color: "var(--foreground)" }}>{formatCurrency(relatedPOs.reduce((s, p) => s + p.total, 0))}</p>
                </div>
            </div>

            {/* Tabs (hidden during edit) */}
            {!isEditing && (
                <>
                    <DrawerTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
                    {activeTab === "pos" && (
                        <div className="space-y-2">
                            {relatedPOs.map((po) => (
                                <div key={po.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: "var(--primary)" }}>{po.id}</p>
                                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{po.date}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{formatCurrency(po.total)}</span>
                                        <StatusBadge status={po.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <DeleteConfirmation
                open={showDelete}
                onClose={() => setShowDelete(false)}
                onConfirm={() => { setShowDelete(false); if (onDelete) { onDelete(vendor); } toast("success", "Vendor deleted", `${vendor.name} deleted`); onClose(); }}
                title={`Delete ${vendor.name}?`}
                description="This action cannot be undone. The vendor and all associated data will be permanently removed."
            />
        </Drawer>
    );
}
