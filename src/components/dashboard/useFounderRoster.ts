import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RosterRow, SyncState } from "./types";

export interface FounderRoster {
  rows: RosterRow[];
  syncState: SyncState | null;
  loading: boolean;
  /** Set when the roster itself could not be read — usually a missing migration. */
  error: string | null;
  /** True while the Notion sync is running. */
  refreshing: boolean;
  refreshError: string | null;
  refresh: () => Promise<void>;
}

/**
 * The joined Notion + garden roster, from founder_roster().
 *
 * The join happens in Postgres (see supabase/sql/2026-09-09-founder-dashboard.sql)
 * so the browser gets one row per human rather than two lists to reconcile.
 * Notion itself is never called from here — sync-notion-participants mirrors it
 * into notion_participants, and `refresh` asks that function to run now.
 */
export function useFounderRoster(enabled: boolean): FounderRoster {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [syncState, setSyncState] = useState<SyncState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [{ data: roster, error: rosterError }, { data: sync }] = await Promise.all([
      supabase.rpc("founder_roster"),
      supabase
        .from("notion_sync_state")
        .select("last_synced_at, last_status, last_error, row_count")
        .eq("id", "participants")
        .maybeSingle(),
    ]);

    if (rosterError) {
      setError(rosterError.message);
      setRows([]);
    } else {
      setError(null);
      setRows((roster as RosterRow[] | null) ?? []);
    }
    setSyncState((sync as SyncState | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    load().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      // The function authorises the caller by their own session against
      // is_founder(), so the browser needs no extra secret.
      const { error: invokeError } = await supabase.functions.invoke("sync-notion-participants");
      if (invokeError) throw invokeError;
      await load();
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : String(err));
      // Re-read anyway: the function records its own failure in
      // notion_sync_state, which is more informative than the invoke error.
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return { rows, syncState, loading, error, refreshing, refreshError, refresh };
}
