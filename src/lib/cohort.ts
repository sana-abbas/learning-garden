import { supabase } from "@/integrations/supabase/client";

export type CohortSlug = "full-stack" | "coding-fundamentals";

/**
 * Resolves the signed-in participant's cohort. The database decides — see
 * ensure_my_cohort() in supabase/sql/2026-10-15-participant-access.sql. It
 * enrols anyone on the invite list who has no membership row yet, into the
 * cohort their invite names.
 *
 * Returns null when they have no cohort: never invited, or removed by a
 * mentor. The garden is invite-only, so callers must treat null as "no
 * access" and show NoAccessScreen rather than defaulting to a garden.
 */
export async function resolveMyCohort(userId: string): Promise<CohortSlug | null> {
  const { data, error } = await supabase.rpc("ensure_my_cohort");
  if (!error && typeof data === "string" && data.length > 0) {
    return data === "coding-fundamentals" || data === "full-stack" ? data : null;
  }

  // Fallback if the function is unavailable: read whatever membership row
  // exists. Deliberately writes nothing.
  const { data: member } = await supabase
    .from("cohort_members")
    .select("cohorts(slug)")
    .eq("user_id", userId)
    .maybeSingle();
  const slug = member?.cohorts?.slug;
  return slug === "coding-fundamentals" || slug === "full-stack" ? slug : null;
}
