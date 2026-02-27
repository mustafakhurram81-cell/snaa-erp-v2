"use client";

import React from "react";
import { Drawer, Button } from "@/components/ui/shared";
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmationProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
}

export function DeleteConfirmation({ open, onClose, onConfirm, title, description }: DeleteConfirmationProps) {
    return (
        <Drawer open={open} onClose={onClose} title="Confirm Delete" width="max-w-md">
            <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--foreground)" }}>{title}</h3>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{description}</p>
            </div>
            <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                <button
                    onClick={onConfirm}
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                    Delete
                </button>
            </div>
        </Drawer>
    );
}
