"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./supabase";

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
    const enableRealtime = options?.realtime !== false;

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .from(tableName)
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
                const { id, ...rest } = item as Record<string, unknown>;
                const { data: result, error: createError } = await supabase
                    .from(tableName)
                    .insert(rest)
                    .select()
                    .single();

                if (createError) throw createError;
                // If realtime is off, update local state manually
                if (!enableRealtime && mountedRef.current && result) {
                    setData((prev) => [result as T, ...prev]);
                }
                return result as T;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to create record";
                if (mountedRef.current) setError(message);
                return null;
            }
        },
        [tableName, enableRealtime]
    );

    const update = useCallback(
        async (id: string, updates: Partial<T>): Promise<T | null> => {
            try {
                setError(null);
                const { data: result, error: updateError } = await supabase
                    .from(tableName)
                    .update(updates as Record<string, unknown>)
                    .eq("id", id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                if (!enableRealtime && mountedRef.current && result) {
                    setData((prev) =>
                        prev.map((item) => (item.id === id ? (result as T) : item))
                    );
                }
                return result as T;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to update record";
                if (mountedRef.current) setError(message);
                return null;
            }
        },
        [tableName, enableRealtime]
    );

    const remove = useCallback(
        async (id: string): Promise<boolean> => {
            try {
                setError(null);
                const { error: deleteError } = await supabase
                    .from(tableName)
                    .delete()
                    .eq("id", id);

                if (deleteError) throw deleteError;
                if (!enableRealtime && mountedRef.current) {
                    setData((prev) => prev.filter((item) => item.id !== id));
                }
                return true;
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to delete record";
                if (mountedRef.current) setError(message);
                return false;
            }
        },
        [tableName, enableRealtime]
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

    return { data, loading, error, fetchAll, create, update, remove, setData };
}

/**
 * Hook for single-row tables like system_settings.
 */
export function useSupabaseSingleton<T extends BaseRecord>(tableName: string) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data: result, error: fetchError } = await supabase
                .from(tableName)
                .select("*")
                .limit(1)
                .single();

            if (fetchError) throw fetchError;
            setData(result as T);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to fetch";
            setError(message);
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
                    .from(tableName)
                    .update(updates as Record<string, unknown>)
                    .eq("id", data.id)
                    .select()
                    .single();

                if (updateError) throw updateError;
                setData(result as T);
                return result as T;
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
