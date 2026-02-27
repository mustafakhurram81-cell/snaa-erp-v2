"use client";

import React, { useState } from "react";
import { Drawer, Button, Input } from "@/components/ui/shared";
import { Send, Mail, Paperclip, X, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface EmailSendProps {
    open: boolean;
    onClose: () => void;
    documentType: string;
    documentNumber: string;
    recipientEmail?: string;
    recipientName?: string;
}

export function EmailSend({ open, onClose, documentType, documentNumber, recipientEmail = "", recipientName = "" }: EmailSendProps) {
    const { toast } = useToast();
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [email, setEmail] = useState(recipientEmail);
    const [cc, setCc] = useState("");
    const [subject, setSubject] = useState(`${documentType} ${documentNumber} from Smith Instruments`);
    const [message, setMessage] = useState(
        `Dear ${recipientName || "Customer"},\n\nPlease find attached ${documentType.toLowerCase()} ${documentNumber}.\n\nIf you have any questions, please don't hesitate to reach out.\n\nBest regards,\nSmith Instruments\nSialkot, Pakistan`
    );

    const handleSend = async () => {
        if (!email) {
            toast("error", "Email required", "Please enter a recipient email address");
            return;
        }
        setSending(true);
        // Simulate sending
        await new Promise((r) => setTimeout(r, 1500));
        setSending(false);
        setSent(true);
        toast("success", "Email sent!", `${documentType} sent to ${email}`);
        setTimeout(() => {
            setSent(false);
            onClose();
        }, 1200);
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title={`Send ${documentType}`}
            width="max-w-lg"
            footer={
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <Paperclip className="w-3.5 h-3.5" />
                        {documentNumber}.pdf attached
                    </div>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSend} disabled={sending || sent}>
                            {sent ? (
                                <><Check className="w-3.5 h-3.5" /> Sent!</>
                            ) : sending ? (
                                <>Sending...</>
                            ) : (
                                <><Send className="w-3.5 h-3.5" /> Send Email</>
                            )}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="space-y-4">
                {/* Status chip */}
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: "var(--secondary)" }}>
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        Sending {documentType.toLowerCase()} as PDF attachment
                    </span>
                </div>

                <Input
                    label="To"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="recipient@example.com"
                />
                <Input
                    label="CC (optional)"
                    type="email"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                />
                <Input
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
                <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--foreground)" }}>Message</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none transition-colors focus:ring-2 focus:ring-blue-500/20"
                        style={{
                            background: "var(--secondary)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                        }}
                    />
                </div>
            </div>
        </Drawer>
    );
}
