/**
 * Form validation utilities for the ERP system.
 * Returns error message string if invalid, null if valid.
 */

export function validateRequired(value: unknown, fieldName: string): string | null {
    if (value === undefined || value === null || value === "") {
        return `${fieldName} is required`;
    }
    if (typeof value === "string" && value.trim() === "") {
        return `${fieldName} is required`;
    }
    return null;
}

export function validateEmail(value: string): string | null {
    if (!value) return null; // not required by default
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
    }
    return null;
}

export function validatePhone(value: string): string | null {
    if (!value) return null;
    // Accept: +923001234567, 03001234567, +1-555-1234, (555) 123-4567
    const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;
    if (!phoneRegex.test(value)) {
        return "Please enter a valid phone number";
    }
    return null;
}

export function validateNumber(value: unknown, opts?: { min?: number; max?: number; fieldName?: string }): string | null {
    const num = Number(value);
    const name = opts?.fieldName || "Value";
    if (isNaN(num)) return `${name} must be a number`;
    if (opts?.min !== undefined && num < opts.min) return `${name} must be at least ${opts.min}`;
    if (opts?.max !== undefined && num > opts.max) return `${name} must be at most ${opts.max}`;
    return null;
}

export function validateDate(value: string, fieldName: string): string | null {
    if (!value) return `${fieldName} is required`;
    const date = new Date(value);
    if (isNaN(date.getTime())) return `${fieldName} must be a valid date`;
    return null;
}

/**
 * Run multiple validations and return the first error found for a set of fields.
 * Usage:
 *   const errors = validateForm({
 *     customer_name: [validateRequired(form.customer_name, "Customer")],
 *     email: [validateRequired(form.email, "Email"), validateEmail(form.email)],
 *   });
 */
export function validateForm(fields: Record<string, (string | null)[]>): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const [field, validations] of Object.entries(fields)) {
        for (const error of validations) {
            if (error) {
                errors[field] = error;
                break; // only first error per field
            }
        }
    }
    return errors;
}

/**
 * Check if a validation result has any errors.
 */
export function hasErrors(errors: Record<string, string>): boolean {
    return Object.keys(errors).length > 0;
}
