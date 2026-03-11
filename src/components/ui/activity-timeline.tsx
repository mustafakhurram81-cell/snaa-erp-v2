"use client";

import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, CheckCircle2, AlertCircle, FileText, ShoppingCart, User, Factory } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  details: string;
  actor_id?: string | null;
  actor_role?: string | null;
  user_email?: string | null;
  created_at: string;
  metadata?: any;
}

export function ActivityTimeline({ entityId }: { entityId: string }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;

    let mounted = true;

    async function fetchLogs() {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch activity logs:", error);
      } else if (mounted) {
        setLogs(data as ActivityLog[]);
      }
      if (mounted) setLoading(false);
    }

    fetchLogs();

    return () => { mounted = false; };
  }, [entityId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 px-4 rounded-lg border border-dashed" style={{ borderColor: 'var(--border)', background: 'var(--secondary)' }}>
        <Clock className="w-8 h-8 mx-auto mb-3 opacity-20" style={{ color: "var(--muted-foreground)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>No recent activity</p>
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Actions taken on this record will appear here.</p>
      </div>
    );
  }

  const getIcon = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('created')) return <FileText className="w-4 h-4 text-emerald-500" />;
    if (act.includes('updated')) return <Clock className="w-4 h-4 text-amber-500" />;
    if (act.includes('deleted') || act.includes('cancelled')) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (act.includes('shipped') || act.includes('delivered')) return <ShoppingCart className="w-4 h-4 text-blue-500" />;
    if (act.includes('approved') || act.includes('paid')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (act.includes('production') || act.includes('manufactur')) return <Factory className="w-4 h-4 text-blue-500" />;
    return <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />;
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-200 dark:before:via-zinc-800 before:to-transparent">
      {logs.map((log) => (
        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Timeline marker */}
          <div className="absolute left-0 -ml-6 md:ml-auto md:right-0 md:left-auto flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white dark:bg-zinc-950 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2" style={{ borderColor: 'var(--border)' }}>
            {getIcon(log.action)}
          </div>

          {/* Card */}
          <div className="w-full relative px-4 py-3 rounded-xl border shadow-sm transition-all hover:shadow-md" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>{log.action}</p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{log.details}</p>
              </div>
              <time className="text-[10px] font-semibold tracking-wider whitespace-nowrap ml-4 uppercase opacity-60" style={{ color: 'var(--foreground)' }}>
                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
