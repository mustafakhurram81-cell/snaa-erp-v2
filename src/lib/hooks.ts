"use client";

import { useEffect, useState, useRef } from "react";

/**
 * Hook to trigger a callback when Cmd+Enter or Ctrl+Enter is pressed.
 * Ideal for quickly saving/submitting forms in an ERP.
 */
export function useKeyboardSave(callback: () => void) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                callback();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [callback]);
}

/**
 * Hook to automatically save form state to localStorage and restore it on mount.
 * Prevents data loss during complex data entry.
 * 
 * @param key Unique key for localStorage (e.g. "new-invoice-draft")
 * @param initialData Default state if nothing is saved
 */
export function useFormDraft<T>(key: string, initialData: T) {
    const [data, setData] = useState<T>(initialData);
    const [isLoaded, setIsLoaded] = useState(false);
    const initialized = useRef(false);

    // Initial load from localStorage
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        try {
            const draft = localStorage.getItem(`form_draft_${key}`);
            if (draft) {
                setData(JSON.parse(draft));
            }
        } catch (e) {
            console.error("Failed to load form draft from localStorage", e);
        } finally {
            setIsLoaded(true);
        }
    }, [key]);

    // Save to localStorage whenever data changes
    useEffect(() => {
        if (!isLoaded) return;

        const timeout = setTimeout(() => {
            try {
                localStorage.setItem(`form_draft_${key}`, JSON.stringify(data));
            } catch (e) {
                console.error("Failed to save form draft to localStorage", e);
            }
        }, 500); // Debounce save by 500ms

        return () => clearTimeout(timeout);
    }, [data, key, isLoaded]);

    const clearDraft = () => {
        try {
            localStorage.removeItem(`form_draft_${key}`);
            setData(initialData);
        } catch (e) {
            console.error("Failed to clear form draft from localStorage", e);
        }
    };

    return {
        data,
        setData,
        clearDraft,
        isLoaded
    };
}
