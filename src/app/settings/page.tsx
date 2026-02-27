"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Save, Building2, Globe, Receipt, Palette } from "lucide-react";
import { PageHeader, Button, Card, Input } from "@/components/ui/shared";
import { useToast } from "@/components/ui/toast";
import { useCurrency, currencies } from "@/lib/currency";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.3 } },
};

export default function SettingsPage() {
    const { toast } = useToast();
    const { currency, setCurrency } = useCurrency();

    const [company, setCompany] = useState({
        name: "Smith Instruments",
        address: "Industrial Area, Sialkot, Pakistan",
        phone: "+92 52 1234567",
        email: "info@smithinstruments.com",
        website: "www.smithinstruments.com",
        taxId: "NTN-1234567-8",
    });

    const [tax, setTax] = useState({
        gst: "18",
        withholding: "4.5",
    });

    const handleSave = () => {
        toast("success", "Settings saved", "Company settings have been updated");
    };

    return (
        <motion.div variants={container} initial="hidden" animate="show">
            <PageHeader
                title="Settings"
                description="Company profile and application preferences"
                actions={
                    <Button onClick={handleSave}>
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                    </Button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Company Profile */}
                <motion.div variants={item}>
                    <Card>
                        <div className="flex items-center gap-2 mb-5">
                            <Building2 className="w-4 h-4" style={{ color: "var(--primary)" }} />
                            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Company Profile</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Company Name</label>
                                <Input value={company.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Address</label>
                                <Input value={company.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, address: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Phone</label>
                                    <Input value={company.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Email</label>
                                    <Input value={company.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, email: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Website</label>
                                    <Input value={company.website} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, website: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Tax ID / NTN</label>
                                    <Input value={company.taxId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany({ ...company, taxId: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Currency & Tax */}
                <motion.div variants={item}>
                    <Card className="mb-5">
                        <div className="flex items-center gap-2 mb-5">
                            <Globe className="w-4 h-4" style={{ color: "var(--primary)" }} />
                            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Currency</h3>
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Default Currency</label>
                            <div className="grid grid-cols-3 gap-2">
                                {currencies.map((curr) => (
                                    <button
                                        key={curr.code}
                                        onClick={() => setCurrency(curr.code)}
                                        className={`p-3 rounded-xl border text-left transition-all ${currency.code === curr.code ? "ring-2 ring-[var(--primary)] border-transparent" : "hover:bg-[var(--secondary)]"}`}
                                        style={{ borderColor: currency.code === curr.code ? "transparent" : "var(--border)" }}
                                    >
                                        <div className="text-lg mb-0.5">{curr.symbol}</div>
                                        <div className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{curr.code}</div>
                                        <div className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{curr.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center gap-2 mb-5">
                            <Receipt className="w-4 h-4" style={{ color: "var(--primary)" }} />
                            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Tax Configuration</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>GST Rate (%)</label>
                                <Input value={tax.gst} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTax({ ...tax, gst: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Withholding Tax (%)</label>
                                <Input value={tax.withholding} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTax({ ...tax, withholding: e.target.value })} />
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* PDF Header Preview */}
            <motion.div variants={item} className="mt-5">
                <Card>
                    <div className="flex items-center gap-2 mb-4">
                        <Palette className="w-4 h-4" style={{ color: "var(--primary)" }} />
                        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>PDF Header Preview</h3>
                    </div>
                    <div className="rounded-xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--secondary)" }}>
                        <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{company.name}</h2>
                        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{company.address}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                            {company.phone} · {company.email} · {company.website}
                        </p>
                        <p className="text-[10px] mt-1 font-medium" style={{ color: "var(--muted-foreground)" }}>NTN: {company.taxId}</p>
                    </div>
                </Card>
            </motion.div>
        </motion.div>
    );
}
