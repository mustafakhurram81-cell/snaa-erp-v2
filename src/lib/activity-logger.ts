import { supabase } from "@/lib/supabase";

/**
 * Log an activity to the activity_logs table.
 * Call this whenever a create/update/delete action happens.
 */
export async function logActivity(params: {
    entityType: string;
    entityId?: string;
    action: string;
    details?: string;
}) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || "System";

        await supabase.from("activity_logs").insert({
            user_email: email,
            entity_type: params.entityType,
            entity_id: params.entityId || null,
            action: params.action,
            details: params.details || null,
        });
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
}
