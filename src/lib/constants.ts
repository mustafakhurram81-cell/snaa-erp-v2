/**
 * Centralized status constants for all ERP entities.
 * Single source‑of‑truth — eliminates case‑sensitivity bugs & magic strings.
 */

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Normalize a status string for safe comparison. */
export function normalizeStatus(status: string): string {
    return status.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/** Check if two statuses match, regardless of casing / separators. */
export function statusEquals(a: string, b: string): boolean {
    return normalizeStatus(a) === normalizeStatus(b);
}

// ─── Invoice Statuses ──────────────────────────────────────────────────────────

export const INVOICE_STATUS = Object.freeze({
    DRAFT: "Draft",
    SENT: "Sent",
    PENDING: "Pending",
    PARTIAL: "Partial",
    PAID: "Paid",
    OVERDUE: "Overdue",
} as const);

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

export const INVOICE_STATUS_OPTIONS: InvoiceStatus[] = Object.values(INVOICE_STATUS);

// ─── Sales Order Statuses ──────────────────────────────────────────────────────

export const SALES_ORDER_STATUS = Object.freeze({
    DRAFT: "Draft",
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
} as const);

export type SalesOrderStatus = (typeof SALES_ORDER_STATUS)[keyof typeof SALES_ORDER_STATUS];

export const SALES_ORDER_STATUS_OPTIONS: SalesOrderStatus[] = Object.values(SALES_ORDER_STATUS);

// ─── Purchase Order Statuses ───────────────────────────────────────────────────

export const PURCHASE_ORDER_STATUS = Object.freeze({
    DRAFT: "Draft",
    APPROVED: "Approved",
    SENT: "Sent",
    FULFILLED: "Fulfilled",
    CANCELLED: "Cancelled",
} as const);

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUS)[keyof typeof PURCHASE_ORDER_STATUS];

export const PURCHASE_ORDER_STATUS_OPTIONS: PurchaseOrderStatus[] = Object.values(PURCHASE_ORDER_STATUS);

// ─── Production Order Statuses ─────────────────────────────────────────────────

export const PRODUCTION_STATUS = Object.freeze({
    PLANNED: "Planned",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
} as const);

export type ProductionStatus = (typeof PRODUCTION_STATUS)[keyof typeof PRODUCTION_STATUS];

export const PRODUCTION_STATUS_OPTIONS: ProductionStatus[] = Object.values(PRODUCTION_STATUS);

// ─── Quotation Statuses ────────────────────────────────────────────────────────

export const QUOTATION_STATUS = Object.freeze({
    DRAFT: "Draft",
    SENT: "Sent",
    ACCEPTED: "Accepted",
    REJECTED: "Rejected",
} as const);

export type QuotationStatus = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS];

export const QUOTATION_STATUS_OPTIONS: QuotationStatus[] = Object.values(QUOTATION_STATUS);

// ─── General Entity Statuses (customers, vendors, products) ────────────────────

export const ENTITY_STATUS = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
} as const);

export type EntityStatus = (typeof ENTITY_STATUS)[keyof typeof ENTITY_STATUS];

// ─── Employee / HR Statuses ────────────────────────────────────────────────────

export const EMPLOYEE_STATUS = Object.freeze({
    ACTIVE: "Active",
    INACTIVE: "Inactive",
} as const);

export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

// ─── Attendance Statuses ───────────────────────────────────────────────────────

export const ATTENDANCE_STATUS = Object.freeze({
    PRESENT: "Present",
    ABSENT: "Absent",
    LATE: "Late",
    HALF_DAY: "Half Day",
} as const);

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

// ─── Payroll Statuses ──────────────────────────────────────────────────────────

export const PAYROLL_STATUS = Object.freeze({
    DRAFT: "Draft",
    APPROVED: "Approved",
    PAID: "Paid",
} as const);

export type PayrollStatus = (typeof PAYROLL_STATUS)[keyof typeof PAYROLL_STATUS];

// ─── Journal Entry Statuses ────────────────────────────────────────────────────

export const JOURNAL_STATUS = Object.freeze({
    DRAFT: "Draft",
    POSTED: "Posted",
    VOID: "Void",
} as const);

export type JournalStatus = (typeof JOURNAL_STATUS)[keyof typeof JOURNAL_STATUS];

// ─── Production Stage Statuses ─────────────────────────────────────────────────

export const STAGE_STATUS = Object.freeze({
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
} as const);

export type StageStatus = (typeof STAGE_STATUS)[keyof typeof STAGE_STATUS];

// ─── Payment Status (Sales Orders) ────────────────────────────────────────────

export const PAYMENT_STATUS = Object.freeze({
    UNPAID: "Unpaid",
    PARTIAL: "Partial",
    PAID: "Paid",
} as const);

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// ─── Status Color Map (dashboard charts) ───────────────────────────────────────

export const STATUS_CHART_COLORS: Record<string, string> = {
    draft: "#94a3b8",
    sent: "#3b82f6",
    pending: "#3b82f6",
    partial: "#f59e0b",
    overdue: "#ef4444",
    paid: "#10b981",
    approved: "#10b981",
    fulfilled: "#10b981",
    cancelled: "#64748b",
    completed: "#10b981",
    confirmed: "#3b82f6",
    "in progress": "#f59e0b",
    planned: "#94a3b8",
    shipped: "#7c3aed",
    delivered: "#10b981",
};

/** Get the chart color for any status (case-insensitive). */
export function getStatusChartColor(status: string): string {
    return STATUS_CHART_COLORS[normalizeStatus(status).replace(/_/g, " ")] || "#94a3b8";
}
