import { supabase } from "@/integrations/supabase/client";

export type DirectoryEntry = {
  user_id: string;
  display_name: string | null;
  checked: Record<string, boolean>;
};

/**
 * types.ts is stale (it only declares user_progress), so this module talks to a
 * narrow hand-written shape rather than adding to the type errors that staleness
 * already causes. Regenerate types.ts and the cast can go.
 */
type DirectoryQuery = {
  rpc: (fn: "cohort_directory") => Promise<{ data: unknown; error: unknown }>;
};

const db = supabase as unknown as DirectoryQuery;

/** First name only — the community feed is on first-name terms. */
export function firstNameOf(displayName: string | null | undefined): string {
  return displayName?.trim().split(" ")[0] || "Someone";
}

/**
 * Names (and progress) for participants in the caller's own cohort, via
 * cohort_directory() — see supabase/sql/2026-08-24-participant-directory.sql.
 *
 * user_progress itself is readable only by its owner and by mentors, which is
 * why the community feed used to show "Someone" for everyone: a participant
 * could not resolve another participant's name. The function returns just the
 * name and progress, and only for the caller's cohort, keeping emails and
 * private reflections closed.
 *
 * `userIds` filters the result — the function decides what the caller may see,
 * so anything outside their cohort simply is not returned.
 */
export async function fetchDirectory(userIds: string[]): Promise<DirectoryEntry[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await db.rpc("cohort_directory");
  if (error || !Array.isArray(data)) return [];
  const wanted = new Set(userIds);
  return (data as DirectoryEntry[]).filter((row) => wanted.has(row.user_id));
}

/** user_id → first name, for resolving names on updates and comments. */
export async function fetchFirstNames(userIds: string[]): Promise<Record<string, string>> {
  const rows = await fetchDirectory(userIds);
  return Object.fromEntries(rows.map((r) => [r.user_id, firstNameOf(r.display_name)]));
}
