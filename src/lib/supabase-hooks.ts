"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

/** Parse Supabase/Postgres error codes into user-friendly messages */
function parseSupabaseError(err: unknown, fallback: string): string {
    if (!(err instanceof Error)) return fallback;
    const msg = err.message || "";
    // Postgres error codes embedded in message
    if (msg.includes("23505") || msg.includes("duplicate key")) return "A record with this value already exists";
    if (msg.includes("23503") || msg.includes("foreign key") || msg.includes("is still referenced")) return "Cannot delete: this record is linked to other data";
    if (msg.includes("42501") || msg.includes("permission denied")) return "Permission denied";
    if (msg.includes("PGRST")) return "Database request failed. Please try again.";
    // Return the original message if it's short enough to be useful
    if (msg.length < 120) return msg;
    return fallback;
}

// Generic type for any table record with an id
type BaseRecord = {
    id: string;
};

/**
 * A reusable hook for CRUD operations on any Supabase table.
 * Includes realtime subscription for auto-refresh on INSERT/UPDATE/DELETE.
 */
export function useSupabaseTable<T extends BaseRecord>(
    tableName: string,
    options?: {
        orderBy?: string;
        ascending?: boolean;
        select?: string;
        filter?: { column: string; value: unknown };
        realtime?: boolean; // Enable realtime subscription (default: true)
    }
) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);
    const lastErrorRef = useRef<string | null>(null);
    const enableRealtime = options?.realtime !== false;

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from(tableName as any)
                .select(options?.select || "*");

            if (options?.filter) {
                query = query.eq(options.filter.column, options.filter.value);
            }

            query = query.order(options?.orderBy || "created_at", {
                ascending: options?.ascending ?? false,
            });

            const { data: result, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            if (mountedRef.current) {
                setData((result as unknown as T[]) || []);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch data";
            if (mountedRef.current) setError(message);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [tableName, options?.orderBy, options?.ascending, options?.select, options?.filter]);

    const create = useCallback(
        async (item: Partial<T>): Promise<T | null> => {
            try {
                setError(null);
                lastErrorRef.current = null;
                const { id: _unusedId, ...rest } = item as Record<string, unknown>; void _unusedId;
                const { data: result, error: createError } = await supabase
                    .from(tableName as any)
                    .insert(rest)
                    .select()
                    .single();

                if (createError) throw createError;
                // If realtime is off, update local state manually
                if (!enableRealtime && mountedRef.current && result) {
                    setData((prev) => [result as unknown as T, ...prev]);
                }
                return result as unknown as T;
            } catch (err: unknown) {
                const message = parseSupabaseError(err, "Failed to create record");
                lastErrorRef.current = message;
                if (mountedRef.current) setError(message);
                return null;
            }
        },
        [tableName, enableRealtime]
    );

    const update = useCallback(
        async (id: string, updates: Partial<T>): Promise<T | null> => {
            // Optimistic update: apply immediately, rollback on error
            let previousData: T[] = [];
            if (mountedRef.current) {
                setData((prev) => {
                    previousData = prev;
                    return prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
                });
            }
            try {
                setError(null);
                lastErrorRef.current = null;
                const { data: result, error: updateError } = await supabase
                    .from(tableName as any)
                    .update(updates as Record<string, unknown>)
                    .eq("id", id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                // Replace optimistic data with server response
                if (mountedRef.current && result) {
                    setData((prev) =>
                        prev.map((item) => (item.id === id ? (result as unknown as T) : item))
                    );
                }
                return result as unknown as T;
            } catch (err: unknown) {
                const message = parseSupabaseError(err, "Failed to update record");
                lastErrorRef.current = message;
                if (mountedRef.current) {
                    setError(message);
                    // Rollback optimistic update
                    setData(previousData);
                }
                return null;
            }
        },
        [tableName]
    );

    const remove = useCallback(
        async (id: string): Promise<boolean> => {
            // Optimistic delete: remove immediately, rollback on error
            let previousData: T[] = [];
            if (mountedRef.current) {
                setData((prev) => {
                    previousData = prev;
                    return prev.filter((item) => item.id !== id);
                });
            }
            try {
                setError(null);
                lastErrorRef.current = null;
                const { error: deleteError } = await supabase
                    .from(tableName as any)
                    .delete()
                    .eq("id", id);

                if (deleteError) throw deleteError;
                return true;
            } catch (err: unknown) {
                const message = parseSupabaseError(err, "Failed to delete record");
                lastErrorRef.current = message;
                if (mountedRef.current) {
                    setError(message);
                    // Rollback optimistic delete
                    setData(previousData);
                }
                return false;
            }
        },
        [tableName]
    );

    // Initial fetch
    useEffect(() => {
        mountedRef.current = true;
        fetchAll();
        return () => {
            mountedRef.current = false;
        };
    }, [fetchAll]);

    // Realtime subscription
    useEffect(() => {
        if (!enableRealtime) return;

        const channel = supabase
            .channel(`realtime-${tableName}`)
            .on(
                "postgres_changes" as any,
                { event: "INSERT", schema: "public", table: tableName },
                (payload: any) => {
                    if (mountedRef.current && payload.new) {
                        setData((prev) => {
                            // Avoid duplicates
                            if (prev.some(item => item.id === payload.new.id)) return prev;
                            return [payload.new as T, ...prev];
                        });
                    }
                }
            )
            .on(
                "postgres_changes" as any,
                { event: "UPDATE", schema: "public", table: tableName },
                (payload: any) => {
                    if (mountedRef.current && payload.new) {
                        setData((prev) =>
                            prev.map((item) =>
                                item.id === payload.new.id ? (payload.new as T) : item
                            )
                        );
                    }
                }
            )
            .on(
                "postgres_changes" as any,
                { event: "DELETE", schema: "public", table: tableName },
                (payload: any) => {
                    if (mountedRef.current && payload.old) {
                        setData((prev) =>
                            prev.filter((item) => item.id !== payload.old.id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [tableName, enableRealtime]);

    return { data, loading, error, fetchAll, create, update, remove, setData, lastError: lastErrorRef };
}

/**
 * Hook for single-row tables like system_settings.
 */
export function useSupabaseSingleton<T extends BaseRecord>(tableName: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const retryRef = useRef(0);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data: result, error: fetchError } = await supabase
                .from(tableName as any)
                .select("*")
                .limit(1)
                .maybeSingle();

            if (fetchError) throw fetchError;
            // If no data returned (auth session may not be ready), retry up to 3 times
            if (!result && retryRef.current < 3) {
                retryRef.current++;
                setTimeout(() => fetch(), 500);
            }
            setData(result as unknown as T);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch";
            setError(message);
            console.error(`useSupabaseSingleton(${tableName}):`, message);
        } finally {
            setLoading(false);
        }
    }, [tableName]);

    const update = useCallback(
        async (updates: Partial<T>): Promise<T | null> => {
            try {
                setError(null);
                if (!data?.id) return null;
                const { data: result, error: updateError } = await supabase
                    .from(tableName as any)
                    .update(updates as Record<string, unknown>)
                    .eq("id", data.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                setData(result as unknown as T);
                return result as unknown as T;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to update";
                setError(message);
                return null;
            }
        },
        [tableName, data?.id]
    );

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { data, loading, error, update, refetch: fetch };
}
