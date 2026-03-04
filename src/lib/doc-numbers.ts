import { supabase } from "@/lib/supabase";

/**
 * Centralized document number generator.
 * Queries the latest record in the given table, extracts the trailing number,
 * and returns the next sequential document number.
 */
export async function getNextDocNumber(
    prefix: string,
    table: string,
    column: string
): Promise<string> {
    const year = new Date().getFullYear();
    const { data } = await (supabase as any)
        .from(table)
        .select(column)
        .order("created_at", { ascending: false })
        .limit(1);

    if (data && data.length > 0) {
        const match = String(data[0][column]).match(/(\d+)$/);
        if (match) {
            return `${prefix}-${year}-${String(parseInt(match[1]) + 1).padStart(3, "0")}`;
        }
    }
    return `${prefix}-${year}-001`;
}

// Convenience wrappers
export const getNextSONumber = () => getNextDocNumber("SO", "sales_orders", "order_number");
export const getNextINVNumber = () => getNextDocNumber("INV", "invoices", "invoice_number");
export const getNextQTNumber = () => getNextDocNumber("QT", "quotations", "quote_number");
export const getNextPONumber = () => getNextDocNumber("PO", "purchase_orders", "po_number");
export const getNextJONumber = () => getNextDocNumber("JO", "production_orders", "job_number");
