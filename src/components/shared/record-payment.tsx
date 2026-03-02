"use client";

import React, { useState } from "react";
import { Drawer, Button, Input } from "@/components/ui/shared";
import { DollarSign, Check, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

export interface PaymentRecord {
    amount: number;
    method: string;
    reference: string;
    date: string;
}

interface RecordPaymentProps {
    open: boolean;
    onClose: () => void;
    invoiceNumber: string;
    invoiceTotal: number;
    invoicePaid: number;
    onRecord: (payment: PaymentRecord) => void;
}

const paymentMethods = [
    "Wire Transfer",
    "Check",
    "Credit Card",
    "Cash",
    "Bank Transfer",
    "PayPal",
    "Other",
];

export function RecordPayment({ open, onClose, invoiceNumber, invoiceTotal, invoicePaid, onRecord }: RecordPaymentProps) {
    const { toast } = useToast();
    const [recording, setRecording] = useState(false);
    const [recorded, setRecorded] = useState(false);
    const balance = invoiceTotal - invoicePaid;

    const [amount, setAmount] = useState(String(balance));
    const [method, setMethod] = useState("Wire Transfer");
    const [reference, setReference] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

    const handleRecord = async () => {
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            toast("error", "Invalid amount", "Please enter a valid payment amount");
            return;
        }
        if (numAmount > balance) {
            toast("error", "Amount exceeds balance", `Maximum payment is ${formatCurrency(balance)}`);
            return;
        }

        setRecording(true);
        await new Promise((r) => setTimeout(r, 800));
        setRecording(false);
        setRecorded(true);

        onRecord({ amount: numAmount, method, reference: reference || `PAY-${Date.now().toString(36).toUpperCase()}`, date });
        toast("success", "Payment recorded", `${formatCurrency(numAmount)} recorded for ${invoiceNumber}`);

        setTimeout(() => {
            setRecorded(false);
            onClose();
            // Reset form
            setAmount(String(balance));
            setReference("");
        }, 800);
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Record Payment"
            width="max-w-lg"
            footer={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <CreditCard className="w-3.5 h-3.5" />
                        Balance: {formatCurrency(balance)}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleRecord} disabled={recording || recorded}>
                            {recorded ? (
                                <><Check className="w-3.5 h-3.5" /> Recorded!</>
                            ) : recording ? (
                                <>Recording...</>
                            ) : (
                                <><DollarSign className="w-3.5 h-3.5" /> Record Payment</>
                            )}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Invoice summary */}
                <div className="rounded-xl p-4" style={{ background: "var(--secondary)" }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{invoiceNumber}</span>
                        <DollarSign className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total</p>
                            <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{formatCurrency(invoiceTotal)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Paid</p>
                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(invoicePaid)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Balance</p>
                            <p className="text-sm font-bold text-red-600">{formatCurrency(balance)}</p>
                        </div>
                    </div>
                </div>

                <Input
                    label="Payment Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                />

                <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--foreground)" }}>Payment Method</label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                        style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                        {paymentMethods.map((m) => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>

                <Input
                    label="Reference Number"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. WT-20260302 or CHK-9901"
                />

                <Input
                    label="Payment Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </div>
        </Drawer>
    );
}
