import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity-logger";

/**
 * Adjust inventory stock when a sales order is completed/shipped.
 * Deducts stock for each line item in the order.
 */
export async function adjustStockForSO(
    orderId: string,
    direction: "deduct" | "restore"
): Promise<{ success: boolean; adjustments: { product: string; qty: number }[] }> {
    try {
        // Fetch SO line items
        const { data: lineItems, error } = await supabase
            .from("sales_order_items")
            .select("product_name, quantity, product_id")
            .eq("order_id", orderId);

        if (error || !lineItems || lineItems.length === 0) {
            // Fallback: try from the order itself if no line items table
            console.warn("No line items found for SO:", orderId);
            return { success: true, adjustments: [] };
        }

        const adjustments: { product: string; qty: number }[] = [];

        for (const item of lineItems) {
            if (!item.product_id) continue;
            const qty = direction === "deduct" ? -(item.quantity || 0) : (item.quantity || 0);

            const { data: product } = await supabase
                .from("products")
                .select("stock, name")
                .eq("id", item.product_id)
                .single();

            if (product) {
                const newStock = Math.max(0, (product.stock || 0) + qty);
                await supabase
                    .from("products")
                    .update({ stock: newStock })
                    .eq("id", item.product_id);

                adjustments.push({ product: product.name || item.product_name || "Unknown", qty });
            }
        }

        // Log activity
        logActivity({
            entityType: "inventory",
            entityId: orderId,
            action: direction === "deduct" ? "stock_deducted" : "stock_restored",
            details: `${direction === "deduct" ? "Deducted" : "Restored"} stock for SO ${orderId}: ${adjustments.map(a => `${a.product} (${a.qty > 0 ? "+" : ""}${a.qty})`).join(", ")}`,
        });

        return { success: true, adjustments };
    } catch (err) {
        console.error("Stock adjustment error:", err);
        return { success: false, adjustments: [] };
    }
}

/**
 * Adjust inventory stock when a purchase order is fully received.
 * Adds stock for each line item in the PO based on its full quantity.
 */
export async function adjustStockForPO(
    purchaseOrderId: string
): Promise<{ success: boolean; adjustments: { product: string; qty: number }[] }> {
    try {
        const { data: lineItems, error } = await supabase
            .from("purchase_order_items")
            .select("description, quantity, product_id")
            .eq("purchase_order_id", purchaseOrderId);

        if (error || !lineItems || lineItems.length === 0) {
            console.warn("No line items found for PO:", purchaseOrderId);
            return { success: true, adjustments: [] };
        }

        const adjustments: { product: string; qty: number }[] = [];

        for (const item of lineItems) {
            if (!item.product_id) continue;
            const qty = Number(item.quantity) || 0;

            const { data: product } = await supabase
                .from("products")
                .select("stock, name")
                .eq("id", item.product_id)
                .single();

            if (product) {
                const newStock = (product.stock || 0) + qty;
                await supabase
                    .from("products")
                    .update({ stock: newStock })
                    .eq("id", item.product_id);

                adjustments.push({ product: product.name || item.description, qty });
            }
        }

        logActivity({
            entityType: "inventory",
            entityId: purchaseOrderId,
            action: "stock_added",
            details: `Added full stock from PO ${purchaseOrderId}: ${adjustments.map(a => `${a.product} (+${a.qty})`).join(", ")}`,
        });

        return { success: true, adjustments };
    } catch (err) {
        console.error("Stock adjustment error:", err);
        return { success: false, adjustments: [] };
    }
}

/**
 * Adjust inventory stock for a partial receipt of a purchase order.
 * Updates stock for specific items by the received quantity.
 */
export async function adjustStockForPartialReceipt(
    purchaseOrderId: string,
    receivedItems: { productId: string; quantity: number; description: string }[]
): Promise<{ success: boolean; adjustments: { product: string; qty: number }[] }> {
    try {
        const adjustments: { product: string; qty: number }[] = [];

        for (const item of receivedItems) {
            if (!item.productId || item.quantity <= 0) continue;

            const { data: product } = await supabase
                .from("products")
                .select("stock, name")
                .eq("id", item.productId)
                .single();

            if (product) {
                const newStock = (product.stock || 0) + item.quantity;
                await supabase
                    .from("products")
                    .update({ stock: newStock })
                    .eq("id", item.productId);

                adjustments.push({ product: product.name || item.description, qty: item.quantity });
            }
        }

        if (adjustments.length > 0) {
            logActivity({
                entityType: "inventory",
                entityId: purchaseOrderId,
                action: "stock_added_partial",
                details: `Added partial stock from PO ${purchaseOrderId}: ${adjustments.map(a => `${a.product} (+${a.qty})`).join(", ")}`,
            });
        }

        return { success: true, adjustments };
    } catch (err) {
        console.error("Partial stock adjustment error:", err);
        return { success: false, adjustments: [] };
    }
}
