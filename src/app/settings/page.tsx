"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Save, Building2, Globe, Receipt, Palette, Hash, Bell, User, Lock, Eye, EyeOff, Mail } from "lucide-react";
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

    const [docNumbers, setDocNumbers] = useState({
        qt: { prefix: "QT", next: "2026-012" },
        so: { prefix: "SO", next: "2026-010" },
        inv: { prefix: "INV", next: "2026-008" },
        po: { prefix: "PO", next: "2026-006" },
        jo: { prefix: "JO", next: "2026-004" },
    });

    const [notifications, setNotifications] = useState({
        orderConfirmation: true,
        shippingUpdates: true,
        paymentReceipts: true,
        lowStock: true,
        productionAlerts: false,
        weeklyReport: true,
    });

    const [profile, setProfile] = useState({
        name: "Mustafa Khurram",
        email: "mustafa@smithinstruments.com",
        role: "Admin",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [newEmail, setNewEmail] = useState("");
    const [emailConfirmPassword, setEmailConfirmPassword] = useState("");

    const handleSave = () => {
        toast("success", "Settings saved", "All settings have been updated");
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

            {/* Document Numbering */}
            <motion.div variants={item} className="mt-5">
                <Card>
                    <div className="flex items-center gap-2 mb-5">
                        <Hash className="w-4 h-4" style={{ color: "var(--primary)" }} />
                        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Document Numbering</h3>
                    </div>
                    <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>Configure prefix and next number for each document type</p>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        {(Object.entries(docNumbers) as [string, { prefix: string; next: string }][]).map(([key, val]) => (
                            <div key={key} className="rounded-xl border p-3" style={{ borderColor: "var(--border)" }}>
                                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
                                    {key === "qt" ? "Quotation" : key === "so" ? "Sales Order" : key === "inv" ? "Invoice" : key === "po" ? "Purchase Order" : "Job Order"}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Input
                                        value={val.prefix}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocNumbers({ ...docNumbers, [key]: { ...val, prefix: e.target.value } })}
                                        className="w-16 text-center"
                                    />
                                    <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>-</span>
                                    <Input
                                        value={val.next}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDocNumbers({ ...docNumbers, [key]: { ...val, next: e.target.value } })}
                                    />
                                </div>
                                <p className="text-[10px] mt-1.5 text-center" style={{ color: "var(--muted-foreground)" }}>
                                    Next: <span className="font-semibold" style={{ color: "var(--primary)" }}>{val.prefix}-{val.next}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            </motion.div>

            {/* Notification Preferences */}
            <motion.div variants={item} className="mt-5">
                <Card>
                    <div className="flex items-center gap-2 mb-5">
                        <Bell className="w-4 h-4" style={{ color: "var(--primary)" }} />
                        <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Notification Preferences</h3>
                    </div>
                    <div className="space-y-3">
                        {[
                            { key: "orderConfirmation", label: "Order Confirmations", desc: "Email when a new order is confirmed" },
                            { key: "shippingUpdates", label: "Shipping Updates", desc: "Email when order status changes to shipped" },
                            { key: "paymentReceipts", label: "Payment Receipts", desc: "Email when a payment is recorded" },
                            { key: "lowStock", label: "Low Stock Alerts", desc: "Alert when product falls below reorder point" },
                            { key: "productionAlerts", label: "Production Alerts", desc: "Alert when a job order stage is delayed" },
                            { key: "weeklyReport", label: "Weekly Summary", desc: "Weekly email with business performance" },
                        ].map((notif) => (
                            <div key={notif.key} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: "var(--border)" }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{notif.label}</p>
                                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{notif.desc}</p>
                                </div>
                                <button
                                    onClick={() => setNotifications({ ...notifications, [notif.key]: !notifications[notif.key as keyof typeof notifications] })}
                                    className={`relative w-10 h-5.5 rounded-full transition-colors ${notifications[notif.key as keyof typeof notifications] ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
                                    style={{ width: "40px", height: "22px" }}
                                >
                                    <div
                                        className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform"
                                        style={{ transform: notifications[notif.key as keyof typeof notifications] ? "translateX(19px)" : "translateX(1px)" }}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
                {/* User Profile & Email Change */}
                <motion.div variants={item}>
                    <Card>
                        <div className="flex items-center gap-2 mb-5">
                            <User className="w-4 h-4" style={{ color: "var(--primary)" }} />
                            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>User Profile</h3>
                        </div>
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold">MK</div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{profile.name}</p>
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{profile.email}</p>
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{profile.role}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Full Name</label>
                                <Input value={profile.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({ ...profile, name: e.target.value })} />
                            </div>

                            {/* Change Email Section */}
                            <div className="pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Mail className="w-3.5 h-3.5" style={{ color: "var(--primary)" }} />
                                    <h4 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--foreground)" }}>Change Email</h4>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Current Email</label>
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm" style={{ background: "var(--secondary)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                                            {profile.email}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>New Email Address</label>
                                        <Input
                                            type="email"
                                            placeholder="new-email@example.com"
                                            value={newEmail}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Confirm Password (to change email)</label>
                                        <Input
                                            type="password"
                                            placeholder="Enter your current password"
                                            value={emailConfirmPassword}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <Button variant="secondary" onClick={() => {
                                        if (!newEmail.trim()) { toast("error", "Please enter a new email address"); return; }
                                        if (!newEmail.includes("@") || !newEmail.includes(".")) { toast("error", "Please enter a valid email address"); return; }
                                        if (!emailConfirmPassword.trim()) { toast("error", "Please enter your password to confirm"); return; }
                                        setProfile({ ...profile, email: newEmail });
                                        setNewEmail("");
                                        setEmailConfirmPassword("");
                                        toast("success", "Email updated", `Email changed to ${newEmail}`);
                                    }}>
                                        <Mail className="w-3.5 h-3.5" /> Update Email
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Password */}
                <motion.div variants={item}>
                    <Card>
                        <div className="flex items-center gap-2 mb-5">
                            <Lock className="w-4 h-4" style={{ color: "var(--primary)" }} />
                            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Change Password</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Current Password</label>
                                <div className="relative">
                                    <Input type={showPassword ? "text" : "password"} value={passwords.current} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, current: e.target.value })} placeholder="Enter current password" />
                                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded" style={{ color: "var(--muted-foreground)" }}>
                                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>New Password</label>
                                <Input type={showPassword ? "text" : "password"} value={passwords.new} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, new: e.target.value })} placeholder="Enter new password" />
                                {/* Password Strength */}
                                {passwords.new && (() => {
                                    const len = passwords.new.length;
                                    const hasUpper = /[A-Z]/.test(passwords.new);
                                    const hasNumber = /[0-9]/.test(passwords.new);
                                    const hasSpecial = /[^A-Za-z0-9]/.test(passwords.new);
                                    const score = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
                                    const strengthLabel = score <= 1 ? "Weak" : score <= 3 ? "Medium" : "Strong";
                                    const strengthColor = score <= 1 ? "#ef4444" : score <= 3 ? "#f59e0b" : "#10b981";
                                    return (
                                        <div className="mt-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
                                                    <div className="h-full rounded-full transition-all duration-300" style={{ width: `${Math.min(100, score * 20)}%`, background: strengthColor }} />
                                                </div>
                                                <span className="text-[10px] font-semibold" style={{ color: strengthColor }}>{strengthLabel}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                                                <span style={{ color: len >= 8 ? "#10b981" : undefined }}>✓ 8+ chars</span>
                                                <span style={{ color: hasUpper ? "#10b981" : undefined }}>✓ Uppercase</span>
                                                <span style={{ color: hasNumber ? "#10b981" : undefined }}>✓ Number</span>
                                                <span style={{ color: hasSpecial ? "#10b981" : undefined }}>✓ Special char</span>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Confirm New Password</label>
                                <Input type={showPassword ? "text" : "password"} value={passwords.confirm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Confirm new password" />
                                {passwords.confirm && passwords.new !== passwords.confirm && (
                                    <p className="text-[10px] mt-1 text-red-500 font-medium">Passwords do not match</p>
                                )}
                                {passwords.confirm && passwords.new === passwords.confirm && passwords.confirm.length > 0 && (
                                    <p className="text-[10px] mt-1 text-emerald-500 font-medium">✓ Passwords match</p>
                                )}
                            </div>
                            <Button variant="secondary" onClick={() => {
                                if (!passwords.current.trim()) { toast("error", "Please enter your current password"); return; }
                                if (!passwords.new.trim()) { toast("error", "Please enter a new password"); return; }
                                if (passwords.new.length < 8) { toast("error", "Password must be at least 8 characters"); return; }
                                if (passwords.new !== passwords.confirm) { toast("error", "Passwords do not match"); return; }
                                toast("success", "Password updated", "Your password has been changed successfully");
                                setPasswords({ current: "", new: "", confirm: "" });
                            }}>
                                <Lock className="w-3.5 h-3.5" /> Update Password
                            </Button>
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
